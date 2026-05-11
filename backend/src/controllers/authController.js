const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { createTenant, getTenantById, updateTenant } = require('../models/tenantModel');
const { getUserByEmail, getUserByEmailOrName, createUser, getUserById } = require('../models/userModel');

const TOKEN_NAME = 'token';

const JWT_SECRET = process.env.JWT_SECRET || 'uma_chave_super_segura';

function createToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function sendToken(res, token) {
  res.cookie(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function buildUserBillingInfo(user) {
  const billingDays = Number(user.billing_elapsed_days || 0);
  const paidHours = user.billing_paid_age_hours === null || user.billing_paid_age_hours === undefined
    ? null
    : Number(user.billing_paid_age_hours);
  const paidRecently = Number.isFinite(paidHours) && paidHours >= 0 && paidHours < 24;
  const billingType = user.billing_type || 'subscription';

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenant_id: user.tenant_id,
    billing_type: billingType,
    billing_days: Number.isFinite(billingDays) ? billingDays : 0,
    billing_is_due: billingType === 'subscription' && billingDays >= 30,
    billing_paid_recently: paidRecently,
    show_billing_charge: billingType === 'subscription' && user.role !== 'superadmin' && billingDays >= 30 && !paidRecently,
  };
}

async function getUserWithBilling(userId) {
  return db.get(
    `SELECT id, tenant_id, name, email, role, billing_type, created_at, billing_cycle_started_at, billing_paid_at,
            FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - COALESCE(billing_cycle_started_at, created_at))) / 86400)::int AS billing_elapsed_days,
            CASE
              WHEN billing_paid_at IS NULL THEN NULL
              ELSE EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - billing_paid_at)) / 3600
            END AS billing_paid_age_hours
     FROM users
     WHERE id = ?`,
    [userId]
  );
}

async function register(req, res, next) {
  try {
    if (process.env.ENABLE_PUBLIC_REGISTRATION !== 'true') {
      return res.status(403).json({ message: 'Cadastro publico desativado. Solicite acesso ao administrador.' });
    }

    const { email, password, name, tenantName } = req.body;
    if (!email || !password || !name || !tenantName) {
      return res.status(400).json({ message: 'Preencha nome da barbearia, nome completo, email e senha.' });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const tenant = await createTenant(tenantName);
    const user = await createUser(tenant.id, name, email, passwordHash, 'user');

    const token = createToken(user.id);
    sendToken(res, token);

    return res.status(201).json({ user, tenant });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    const user = await getUserByEmailOrName(email);
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciais inválidas.' });
    }

    const tenant = await getTenantById(user.tenant_id);
    const token = createToken(user.id);
    sendToken(res, token);

    const userWithBilling = await getUserWithBilling(user.id);
    return res.json({ user: buildUserBillingInfo(userWithBilling || user), tenant });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res) {
  res.clearCookie(TOKEN_NAME, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' });
  res.json({ message: 'Logout realizado.' });
}

async function me(req, res, next) {
  try {
    const user = await getUserWithBilling(req.user.id);
    const tenant = await getTenantById(req.user.tenant_id);
    res.json({ user: buildUserBillingInfo(user), tenant });
  } catch (error) {
    next(error);
  }
}

async function getTenant(req, res, next) {
  try {
    const tenant = await getTenantById(req.user.tenant_id);
    res.json({ tenant });
  } catch (error) {
    next(error);
  }
}

async function updateTenantSettings(req, res, next) {
  try {
    const { name, theme_color, border_color } = req.body;
    const tenant = await updateTenant(req.user.tenant_id, { name, theme_color, border_color });
    res.json({ tenant });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, logout, me, getTenant, updateTenantSettings };
