const LICENSE_GRACE_DAYS = 3;
const licenseCache = new Map();

function getConfig() {
  return {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    table: process.env.SUPABASE_LICENSE_TABLE || 'clientes',
  };
}

function isConfigured() {
  const config = getConfig();
  return Boolean(config.url && config.key);
}

function licenseCodeFor(user) {
  return String(user?.email || '').trim();
}

function isDateExpired(dateValue) {
  if (!dateValue) return true;
  const expiresAt = new Date(`${dateValue}T23:59:59`).getTime();
  return !Number.isFinite(expiresAt) || expiresAt < Date.now();
}

function evaluateLicense(user, license) {
  if (!license) {
    return { allowed: false, message: 'Licenca nao encontrada. Entre em contato com o suporte.' };
  }
  if (license.status !== 'ativo') {
    return { allowed: false, message: 'Sistema bloqueado. Regularize sua assinatura para continuar.' };
  }
  if ((user.billing_type || 'subscription') === 'full_payment') {
    return { allowed: true };
  }
  if (isDateExpired(license.vence_em)) {
    return { allowed: false, message: 'Assinatura vencida. Entre em contato com o suporte para renovar.' };
  }
  return { allowed: true };
}

function isInsideGracePeriod(cachedLicense) {
  const validatedAt = cachedLicense?.validated_at ? new Date(cachedLicense.validated_at).getTime() : 0;
  return Number.isFinite(validatedAt) && Date.now() - validatedAt <= LICENSE_GRACE_DAYS * 24 * 60 * 60 * 1000;
}

async function fetchRemoteLicense(code) {
  const config = getConfig();
  const baseUrl = config.url.replace(/\/$/, '');
  const endpoint = `${baseUrl}/rest/v1/${config.table}?codigo_licenca=eq.${encodeURIComponent(code)}&select=nome,codigo_licenca,status,vence_em&limit=1`;
  const response = await fetch(endpoint, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
    },
  });
  if (!response.ok) throw new Error(`Falha ao validar licenca (${response.status}).`);
  const licenses = await response.json();
  return licenses[0] || null;
}

async function verifyLicense(user) {
  if (!user || user.role === 'superadmin') return { allowed: true };
  if (!isConfigured()) return { allowed: true, skipped: true, reason: 'Validacao remota nao configurada.' };

  const code = licenseCodeFor(user);
  if (!code) return { allowed: false, message: 'Licenca local sem codigo de acesso.' };

  try {
    const license = await fetchRemoteLicense(code);
    const result = evaluateLicense(user, license);
    if (result.allowed) {
      licenseCache.set(code, { ...license, validated_at: new Date().toISOString() });
    }
    return result;
  } catch (_) {
    const cachedLicense = licenseCache.get(code);
    const cachedResult = evaluateLicense(user, cachedLicense);
    if (cachedResult.allowed && isInsideGracePeriod(cachedLicense)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      message: 'Nao foi possivel validar a licenca pela internet. Conecte o aparelho e tente novamente.',
    };
  }
}

module.exports = { verifyLicense };
