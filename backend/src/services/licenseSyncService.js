const DEFAULT_LICENSE_DAYS = 30;

function getConfig() {
  return {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    table: process.env.SUPABASE_LICENSE_TABLE || 'clientes',
  };
}

function isConfigured() {
  const config = getConfig();
  return Boolean(config.url && config.serviceRoleKey);
}

function addDaysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function licenseCodeFromAccess(access) {
  return String(access || '').trim();
}

function buildLicensePayload({ name, email, billingType = 'subscription', status = 'ativo', expiresAt }) {
  return {
    nome: name,
    codigo_licenca: licenseCodeFromAccess(email),
    status,
    vence_em: billingType === 'full_payment' ? null : (expiresAt || addDaysFromNow(DEFAULT_LICENSE_DAYS)),
  };
}

async function supabaseRequest(path, options = {}) {
  const config = getConfig();
  if (!isConfigured()) {
    return { skipped: true, reason: 'Supabase nao configurado no backend.' };
  }

  const baseUrl = config.url.replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/rest/v1/${config.table}${path}`, {
    ...options,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.message || data?.details || `Supabase retornou erro ${response.status}.`;
    throw new Error(message);
  }

  return { skipped: false, data };
}

async function upsertLicense(payload) {
  const normalized = {
    ...payload,
    codigo_licenca: licenseCodeFromAccess(payload.codigo_licenca),
  };
  if (!normalized.codigo_licenca) {
    return { skipped: true, reason: 'Codigo de licenca vazio.' };
  }

  return supabaseRequest('?on_conflict=codigo_licenca', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(normalized),
  });
}

async function updateLicenseByCode(code, patch) {
  const licenseCode = licenseCodeFromAccess(code);
  if (!licenseCode) {
    return { skipped: true, reason: 'Codigo de licenca vazio.' };
  }

  return supabaseRequest(`?codigo_licenca=eq.${encodeURIComponent(licenseCode)}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

async function syncActiveLicense(user, options = {}) {
  if (!user || user.role === 'superadmin') {
    return { skipped: true, reason: 'Superadmin nao precisa de licenca remota.' };
  }

  return upsertLicense(buildLicensePayload({
    name: options.name || user.tenant_name || user.name,
    email: options.email || user.email,
    billingType: options.billingType || user.billing_type || 'subscription',
    status: options.status || 'ativo',
    expiresAt: options.expiresAt,
  }));
}

async function blockLicense(userOrCode) {
  const code = typeof userOrCode === 'string' ? userOrCode : userOrCode?.email;
  return updateLicenseByCode(code, { status: 'bloqueado' });
}

async function markLicensePaid(userOrCode) {
  const code = typeof userOrCode === 'string' ? userOrCode : userOrCode?.email;
  return updateLicenseByCode(code, {
    status: 'ativo',
    vence_em: addDaysFromNow(DEFAULT_LICENSE_DAYS),
  });
}

async function markLicenseUnpaid(userOrCode) {
  const code = typeof userOrCode === 'string' ? userOrCode : userOrCode?.email;
  return updateLicenseByCode(code, {
    status: 'vencido',
    vence_em: new Date().toISOString().slice(0, 10),
  });
}

module.exports = {
  addDaysFromNow,
  buildLicensePayload,
  syncActiveLicense,
  blockLicense,
  markLicensePaid,
  markLicenseUnpaid,
};
