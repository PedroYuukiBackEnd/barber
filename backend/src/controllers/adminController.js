const db = require('../config/db');
const bcrypt = require('bcrypt');
const { createTenant } = require('../models/tenantModel');
const { createUser, updateUser } = require('../models/userModel');

const ALLOWED_ROLES = ['superadmin', 'admin', 'user'];

function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function allQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function ensureBillingColumns() {
  const columns = await allQuery(
    `SELECT column_name AS name
     FROM information_schema.columns
     WHERE table_name = 'users'`
  );
  const columnNames = columns.map((column) => column.name);
  if (!columnNames.includes('billing_cycle_started_at')) {
    await runQuery('ALTER TABLE users ADD COLUMN billing_cycle_started_at TIMESTAMP');
    await runQuery('UPDATE users SET billing_cycle_started_at = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE billing_cycle_started_at IS NULL');
  }
  if (!columnNames.includes('billing_paid_at')) {
    await runQuery('ALTER TABLE users ADD COLUMN billing_paid_at TIMESTAMP DEFAULT NULL');
  }
}

function buildUserBillingInfo(user) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const cycleStart = new Date(user.billing_cycle_started_at || user.created_at).getTime();
  const paidAt = user.billing_paid_at ? new Date(user.billing_paid_at).getTime() : null;
  const billingDays = Number.isNaN(cycleStart) ? 0 : Math.max(0, Math.floor((now - cycleStart) / dayMs));
  const paidRecently = paidAt ? (now - paidAt) < dayMs : false;

  return {
    ...user,
    billing_days: billingDays,
    billing_is_due: billingDays >= 30,
    billing_paid_recently: paidRecently,
    show_billing_charge: user.role !== 'superadmin' && (billingDays >= 30 || paidRecently),
  };
}

async function findUserByEmail(email) {
  const users = await allQuery('SELECT id FROM users WHERE email = ?', [email]);
  return users[0];
}

async function getUsers(req, res, next) {
  try {
    await ensureBillingColumns();
    const users = await allQuery(
      `SELECT u.id, u.tenant_id, u.name, u.email, u.role, u.created_at,
              u.billing_cycle_started_at, u.billing_paid_at, t.name AS tenant_name
       FROM users u
       JOIN tenants t ON t.id = u.tenant_id
       ORDER BY u.created_at DESC`
    );
    res.json({ users: users.map(buildUserBillingInfo) });
  } catch (error) {
    next(error);
  }
}

async function markUserBillingPaid(req, res, next) {
  try {
    await ensureBillingColumns();
    const { id } = req.params;
    const { paid } = req.body;

    if (paid) {
      await runQuery(
        'UPDATE users SET billing_cycle_started_at = CURRENT_TIMESTAMP, billing_paid_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } else {
      await runQuery('UPDATE users SET billing_paid_at = NULL WHERE id = ?', [id]);
    }

    const users = await allQuery(
      `SELECT id, name, email, role, created_at, billing_cycle_started_at, billing_paid_at
       FROM users
       WHERE id = ?`,
      [id]
    );

    if (!users.length) {
      return res.status(404).json({ message: 'Usuario nao encontrado.' });
    }

    res.json({ user: buildUserBillingInfo(users[0]) });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    if (Number(id) === Number(req.user.id)) {
      return res.status(400).json({ message: 'Voce nao pode excluir o proprio acesso.' });
    }

    const users = await allQuery('SELECT id, role FROM users WHERE id = ?', [id]);
    if (!users.length) {
      return res.status(404).json({ message: 'Usuario nao encontrado.' });
    }

    if (users[0].role === 'superadmin') {
      const superadmins = await allQuery("SELECT id FROM users WHERE role = 'superadmin'");
      if (superadmins.length <= 1) {
        return res.status(400).json({ message: 'Mantenha pelo menos um superadmin ativo.' });
      }
    }

    await runQuery('DELETE FROM users WHERE id = ?', [id]);
    await runQuery('DELETE FROM tenants WHERE id NOT IN (SELECT DISTINCT tenant_id FROM users)');

    res.json({ message: 'Usuario excluido com sucesso.' });
  } catch (error) {
    next(error);
  }
}

async function createPlatformAdmin(req, res, next) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Preencha nome, email e senha.' });
    }
    if (await findUserByEmail(email)) {
      return res.status(400).json({ message: 'Email ja cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser(req.user.tenant_id, name, email, passwordHash, 'superadmin');

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

async function registerTenant(req, res, next) {
  try {
    const { email, password, name, tenantName } = req.body;
    if (!email || !password || !name || !tenantName) {
      return res.status(400).json({ message: 'Preencha nome, email, senha e nome da barbearia.' });
    }
    if (await findUserByEmail(email)) {
      return res.status(400).json({ message: 'Email ja cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const tenant = await createTenant(tenantName);
    const user = await createUser(tenant.id, name, email, passwordHash, 'admin');

    res.status(201).json({ user, tenant });
  } catch (error) {
    next(error);
  }
}

async function editUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Nome, acesso e role sao obrigatorios.' });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Role invalida.' });
    }
    if (Number(id) === Number(req.user.id) && role !== 'superadmin') {
      return res.status(400).json({ message: 'Voce nao pode remover seu proprio acesso de superadmin.' });
    }

    let passwordHash;
    if (password) {
      passwordHash = await bcrypt.hash(password, 12);
    }

    const updated = await updateUser(id, name, email, role, passwordHash);
    res.json({ user: updated });
  } catch (error) {
    next(error);
  }
}

module.exports = { getUsers, registerTenant, editUser, deleteUser, createPlatformAdmin, markUserBillingPaid };
