const db = require('../config/db');
const { createTenant } = require('../models/tenantModel');
const { createUser, updateUser } = require('../models/userModel');
const { normalizeAttachment } = require('../utils/attachment');
const { normalizeAccess, normalizeAccessKey } = require('../utils/access');
const { hashPassword } = require('../utils/password');
const {
  addDaysFromNow,
  syncActiveLicense,
  blockLicense,
  markLicensePaid,
  markLicenseUnpaid,
} = require('../services/licenseSyncService');

const ALLOWED_ROLES = ['superadmin', 'user'];
const ALLOWED_BILLING_TYPES = ['subscription', 'full_payment'];

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
  const columns = await allQuery('PRAGMA table_info(users)');
  const columnNames = columns.map((column) => column.name);
  if (!columnNames.includes('billing_cycle_started_at')) {
    await runQuery('ALTER TABLE users ADD COLUMN billing_cycle_started_at TEXT');
    await runQuery('UPDATE users SET billing_cycle_started_at = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE billing_cycle_started_at IS NULL');
  }
  if (!columnNames.includes('billing_paid_at')) {
    await runQuery('ALTER TABLE users ADD COLUMN billing_paid_at TEXT DEFAULT NULL');
  }
  if (!columnNames.includes('admin_notes')) {
    await runQuery("ALTER TABLE users ADD COLUMN admin_notes TEXT DEFAULT ''");
  }
  if (!columnNames.includes('billing_type')) {
    await runQuery("ALTER TABLE users ADD COLUMN billing_type TEXT NOT NULL DEFAULT 'subscription'");
  }
  if (!columnNames.includes('billing_proof_name')) {
    await runQuery("ALTER TABLE users ADD COLUMN billing_proof_name TEXT DEFAULT ''");
  }
  if (!columnNames.includes('billing_proof_data')) {
    await runQuery("ALTER TABLE users ADD COLUMN billing_proof_data TEXT DEFAULT ''");
  }
}

function buildUserBillingInfo(user) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const cycleStart = new Date(user.billing_cycle_started_at || user.created_at).getTime();
  const paidAt = user.billing_paid_at ? new Date(user.billing_paid_at).getTime() : null;
  const sqlBillingDays = Number(user.billing_elapsed_days);
  const sqlPaidHours = user.billing_paid_age_hours === null || user.billing_paid_age_hours === undefined
    ? null
    : Number(user.billing_paid_age_hours);
  const billingDays = Number.isFinite(sqlBillingDays)
    ? Math.max(0, sqlBillingDays)
    : (Number.isNaN(cycleStart) ? 0 : Math.max(0, Math.floor((now - cycleStart) / dayMs)));
  const paidRecently = Number.isFinite(sqlPaidHours)
    ? sqlPaidHours >= 0 && sqlPaidHours < 24
    : Boolean(paidAt && (now - paidAt) < dayMs);

  return {
    ...user,
    billing_days: billingDays,
    billing_is_due: billingDays >= 30,
    billing_paid_recently: paidRecently,
    billing_type: user.billing_type || 'subscription',
    billing_proof_name: user.billing_proof_name || '',
    billing_proof_data: user.billing_proof_data || '',
    show_billing_charge: (user.billing_type || 'subscription') === 'subscription' && user.role !== 'superadmin' && (billingDays >= 30 || paidRecently),
  };
}

async function findUserByEmail(email) {
  const users = await allQuery('SELECT id FROM users WHERE lower(email) = lower(?)', [normalizeAccess(email)]);
  return users[0];
}

async function safeLicenseSync(action) {
  try {
    return await action();
  } catch (error) {
    return { skipped: true, warning: error.message || 'Nao foi possivel sincronizar a licenca remota agora.' };
  }
}

async function getUsers(req, res, next) {
  try {
    await ensureBillingColumns();
    const users = await allQuery(
      `SELECT u.id, u.tenant_id, u.name, u.email, u.role, u.created_at,
              u.billing_type, u.admin_notes, u.billing_cycle_started_at, u.billing_paid_at,
              u.billing_proof_name, u.billing_proof_data,
              t.name AS tenant_name
       FROM users u
       JOIN tenants t ON t.id = u.tenant_id
       ORDER BY u.created_at DESC`
    );
    res.json({ users: users.map(buildUserBillingInfo) });
  } catch (error) {
    next(error);
  }
}

async function getRecommendations(req, res, next) {
  try {
    const recommendations = await allQuery(
      `SELECT r.id, r.client_name, r.barbershop_name, r.recommendation,
              r.attachment_name, r.attachment_data, r.created_at,
              u.name AS user_name, t.name AS tenant_name
       FROM recommendations r
       JOIN users u ON u.id = r.user_id
       JOIN tenants t ON t.id = r.tenant_id
       ORDER BY r.created_at DESC`
    );

    res.json({ recommendations });
  } catch (error) {
    next(error);
  }
}

async function deleteRecommendation(req, res, next) {
  try {
    const { id } = req.params;
    await runQuery('DELETE FROM recommendations WHERE id = ?', [id]);
    res.json({ message: 'Recomendacao excluida com sucesso.' });
  } catch (error) {
    next(error);
  }
}

async function getBugReports(req, res, next) {
  try {
    const reports = await allQuery(
      `SELECT b.id, b.client_name, b.barbershop_name, b.description,
              b.attachment_name, b.attachment_data,
              b.resolved_at, b.resolution_message, b.created_at,
              u.name AS user_name, t.name AS tenant_name
       FROM bug_reports b
       JOIN users u ON u.id = b.user_id
       JOIN tenants t ON t.id = b.tenant_id
       WHERE b.resolved_at IS NULL
       ORDER BY b.created_at DESC`
    );

    res.json({ reports });
  } catch (error) {
    next(error);
  }
}

async function resolveBugReport(req, res, next) {
  try {
    const { id } = req.params;
    const reports = await allQuery(
      `SELECT b.id, b.client_name, b.barbershop_name, b.description,
              b.attachment_name, b.attachment_data, b.created_at,
              u.name AS user_name, t.name AS tenant_name
       FROM bug_reports b
       JOIN users u ON u.id = b.user_id
       JOIN tenants t ON t.id = b.tenant_id
       WHERE b.id = ?`,
      [id]
    );

    if (!reports.length) {
      return res.status(404).json({ message: 'Report de bug nao encontrado.' });
    }

    const report = reports[0];
    const message = `Obrigado pelo seu relato, ${report.client_name}. O bug informado na barbearia ${report.barbershop_name || report.tenant_name} foi resolvido. Sua ajuda melhora o sistema para todos.`;

    const updated = await allQuery(
      `UPDATE bug_reports
       SET resolved_at = CURRENT_TIMESTAMP, resolution_message = ?
       WHERE id = ?
       RETURNING id, client_name, barbershop_name, description, resolved_at, resolution_message, created_at`,
      [message, id]
    );

    res.json({ report: updated[0] });
  } catch (error) {
    next(error);
  }
}

async function markUserBillingPaid(req, res, next) {
  try {
    await ensureBillingColumns();
    const { id } = req.params;
    const { paid, billing_proof_name, billing_proof_data } = req.body;
    const { attachmentName, attachmentData } = normalizeAttachment(billing_proof_name, billing_proof_data, {
      fallbackName: 'comprovante-cobranca',
    });

    if (paid) {
      await runQuery(
        'UPDATE users SET billing_cycle_started_at = CURRENT_TIMESTAMP, billing_paid_at = CURRENT_TIMESTAMP, billing_proof_name = ?, billing_proof_data = ? WHERE id = ?',
        [attachmentName, attachmentData, id]
      );
    } else {
      await runQuery("UPDATE users SET billing_paid_at = NULL, billing_proof_name = '', billing_proof_data = '' WHERE id = ?", [id]);
    }

    const users = await allQuery(
      `SELECT id, name, email, role, billing_type, billing_proof_name, billing_proof_data, created_at, billing_cycle_started_at, billing_paid_at
       FROM users
       WHERE id = ?`,
      [id]
    );

    if (!users.length) {
      return res.status(404).json({ message: 'Usuario nao encontrado.' });
    }

    const user = buildUserBillingInfo(users[0]);
    const licenseSync = user.role === 'superadmin'
      ? { skipped: true, reason: 'Superadmin nao precisa de licenca remota.' }
      : await (paid ? markLicensePaid(user) : markLicenseUnpaid(user));

    res.json({ user, licenseSync });
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

    const users = await allQuery('SELECT id, role, email FROM users WHERE id = ?', [id]);
    if (!users.length) {
      return res.status(404).json({ message: 'Usuario nao encontrado.' });
    }

    if (users[0].role === 'superadmin') {
      const superadmins = await allQuery("SELECT id FROM users WHERE role = 'superadmin'");
      if (superadmins.length <= 1) {
        return res.status(400).json({ message: 'Mantenha pelo menos um superadmin ativo.' });
      }
    }

    const licenseSync = users[0].role === 'superadmin'
      ? { skipped: true, reason: 'Superadmin nao precisa de licenca remota.' }
      : await blockLicense(users[0]);

    await runQuery('DELETE FROM users WHERE id = ?', [id]);
    await runQuery('DELETE FROM tenants WHERE id NOT IN (SELECT DISTINCT tenant_id FROM users)');

    res.json({ message: 'Usuario excluido com sucesso.', licenseSync });
  } catch (error) {
    next(error);
  }
}

async function createPlatformAdmin(req, res, next) {
  try {
    const { email, password, name } = req.body;
    const access = normalizeAccess(email);
    if (!access || !password || !name) {
      return res.status(400).json({ message: 'Preencha nome, email e senha.' });
    }
    if (await findUserByEmail(access)) {
      return res.status(400).json({ message: 'Email ja cadastrado.' });
    }

    const passwordHash = hashPassword(password);
    const user = await createUser(req.user.tenant_id, name, access, passwordHash, 'superadmin');

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

async function registerTenant(req, res, next) {
  try {
    const { email, password, name, tenantName, adminNotes, billingType } = req.body;
    const access = normalizeAccess(email);
    if (!access || !password || !name || !tenantName) {
      return res.status(400).json({ message: 'Preencha nome da barbearia, nome completo, email e senha.' });
    }
    if (await findUserByEmail(access)) {
      return res.status(400).json({ message: 'Email ja cadastrado.' });
    }

    const selectedBillingType = ALLOWED_BILLING_TYPES.includes(billingType) ? billingType : 'subscription';
    const passwordHash = hashPassword(password);
    const tenant = await createTenant(tenantName);
    const user = await createUser(tenant.id, name, access, passwordHash, 'user', adminNotes || '', selectedBillingType);
    const licenseSync = await safeLicenseSync(() => syncActiveLicense({
        ...user,
        tenant_name: tenant.name,
        billing_type: selectedBillingType,
      }));

    res.status(201).json({ user, tenant, licenseSync });
  } catch (error) {
    next(error);
  }
}

async function editUser(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, role, billingType, adminNotes, password, billingDays } = req.body;
    const access = normalizeAccess(email);
    if (!name || !access || !role) {
      return res.status(400).json({ message: 'Nome, acesso e role sao obrigatorios.' });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Role invalida.' });
    }
    if (billingType && !ALLOWED_BILLING_TYPES.includes(billingType)) {
      return res.status(400).json({ message: 'Tipo de cobranca invalido.' });
    }
    if (Number(id) === Number(req.user.id) && role !== 'superadmin') {
      return res.status(400).json({ message: 'Voce nao pode remover seu proprio acesso de superadmin.' });
    }

    let passwordHash;
    if (password) {
      passwordHash = hashPassword(password);
    }

    const previousUsers = await allQuery(
      `SELECT u.id, u.email, u.role, u.billing_type, t.name AS tenant_name
       FROM users u
       JOIN tenants t ON t.id = u.tenant_id
       WHERE u.id = ?`,
      [id]
    );
    if (!previousUsers.length) {
      return res.status(404).json({ message: 'Usuario nao encontrado.' });
    }

    const updated = await updateUser(id, name, access, role, billingType || 'subscription', adminNotes || '', passwordHash);
    let licenseSync = { skipped: true, reason: 'Superadmin nao precisa de licenca remota.' };
    if (billingDays !== undefined && role !== 'superadmin') {
      const days = Math.max(0, Math.floor(Number(billingDays) || 0));
      const cycleStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      await runQuery('UPDATE users SET billing_cycle_started_at = ?, billing_paid_at = NULL WHERE id = ?', [cycleStart, id]);
      if (normalizeAccessKey(previousUsers[0].email) !== normalizeAccessKey(access)) {
        await safeLicenseSync(() => blockLicense(previousUsers[0]));
      }
      licenseSync = await safeLicenseSync(() => syncActiveLicense({
        ...updated,
        tenant_name: previousUsers[0].tenant_name,
      }, {
        status: days >= 30 ? 'vencido' : 'ativo',
        expiresAt: addDaysFromNow(Math.max(0, 30 - days)),
      }));
    } else if (role !== 'superadmin') {
      if (normalizeAccessKey(previousUsers[0].email) !== normalizeAccessKey(access)) {
        await safeLicenseSync(() => blockLicense(previousUsers[0]));
      }
      licenseSync = await safeLicenseSync(() => syncActiveLicense({
        ...updated,
        tenant_name: previousUsers[0].tenant_name,
      }));
    } else if (previousUsers[0].role !== 'superadmin') {
      licenseSync = await safeLicenseSync(() => blockLicense(previousUsers[0]));
    }
    res.json({ user: updated, licenseSync });
  } catch (error) {
    next(error);
  }
}

module.exports = { getUsers, getRecommendations, deleteRecommendation, getBugReports, resolveBugReport, registerTenant, editUser, deleteUser, createPlatformAdmin, markUserBillingPaid };
