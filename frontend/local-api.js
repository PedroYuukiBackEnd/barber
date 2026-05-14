(function () {
  const isStandalone = location.protocol === 'file:' || Boolean(window.SistemaBarberAndroid);
  if (!isStandalone) return;

  const STORAGE_KEY = 'sistema_barber_standalone_db_v1';
  const SESSION_KEY = 'sistema_barber_standalone_session_v1';
  const LICENSE_CACHE_KEY = 'sistema_barber_license_cache_v1';
  const LICENSE_GRACE_DAYS = 3;
  const SUPABASE_URL = 'https://nvgpylhbwripujfwlskg.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52Z3B5bGhid3JpcHVqZndsc2tnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3ODgwNzEsImV4cCI6MjA5NDM2NDA3MX0.PDATmodiolnySnRnZKXAHVeyNsHwSMxnBekGuBs0uY8';
  const originalFetch = window.fetch.bind(window);

  function now() {
    return new Date().toISOString();
  }

  function loadDb() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    const db = {
      next: {
        tenant: 2,
        user: 2,
        client: 1,
        service: 1,
        appointment: 1,
        history: 1,
        recommendation: 1,
        bugReport: 1,
      },
      tenants: [{
        id: 1,
        name: 'Plataforma Local',
        theme_color: '#d4d4d8',
        border_color: '#3f3f46',
        logo_url: '',
        require_pix_proof_to_finish: false,
        created_at: now(),
      }],
      users: [{
        id: 1,
        tenant_id: 1,
        name: 'Admin Local',
        email: 'localadmin',
        password: 'localadmin123',
        role: 'superadmin',
        billing_type: 'subscription',
        admin_notes: '',
        billing_cycle_started_at: now(),
        billing_paid_at: null,
        billing_proof_name: '',
        billing_proof_data: '',
        created_at: now(),
      }],
      clients: [],
      services: [],
      appointments: [],
      serviceHistory: [],
      recommendations: [],
      bugReports: [],
    };
    saveDb(db);
    return db;
  }

  function saveDb(db) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }

  function currentUser(db) {
    const id = Number(localStorage.getItem(SESSION_KEY) || 0);
    return db.users.find((user) => user.id === id) || null;
  }

  function tenantFor(db, user) {
    return db.tenants.find((tenant) => tenant.id === user?.tenant_id) || null;
  }

  function jsonResponse(data, status = 200) {
    return Promise.resolve(new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }));
  }

  function parseBody(options) {
    if (!options?.body) return {};
    try {
      return JSON.parse(options.body);
    } catch (_) {
      return {};
    }
  }

  function requireSession(db) {
    const user = currentUser(db);
    if (!user) return { error: { message: 'Não autorizado. Faça login.' }, status: 401 };
    return { user };
  }

  function requireUser(db) {
    const session = requireSession(db);
    if (session.error) return session;
    if (session.user.role !== 'user') return { error: { message: 'Acesso negado para este painel.' }, status: 403 };
    return session;
  }

  function requireSuperadmin(db) {
    const session = requireSession(db);
    if (session.error) return session;
    if (session.user.role !== 'superadmin') return { error: { message: 'Acesso restrito ao administrador da plataforma.' }, status: 403 };
    return session;
  }

  function billingInfo(user) {
    const dayMs = 24 * 60 * 60 * 1000;
    const start = new Date(user.billing_cycle_started_at || user.created_at).getTime();
    const paidAt = user.billing_paid_at ? new Date(user.billing_paid_at).getTime() : null;
    const billingDays = Number.isFinite(start) ? Math.max(0, Math.floor((Date.now() - start) / dayMs)) : 0;
    const paidRecently = Boolean(paidAt && Date.now() - paidAt < dayMs);
    return {
      ...user,
      password: undefined,
      billing_days: billingDays,
      billing_is_due: user.billing_type === 'subscription' && billingDays >= 30,
      billing_paid_recently: paidRecently,
      show_billing_charge: user.billing_type === 'subscription' && user.role !== 'superadmin' && billingDays >= 30 && !paidRecently,
    };
  }

  function servicesForAppointment(db, appointmentId) {
    const appointment = db.appointments.find((item) => item.id === Number(appointmentId));
    if (!appointment) return [];
    return (appointment.service_ids || []).map((serviceId) => {
      const service = db.services.find((item) => item.id === Number(serviceId));
      return {
        service_id: serviceId,
        service_name: service?.name || 'Serviço removido',
        service_price: service?.price || 0,
      };
    });
  }

  function withAppointmentServices(db, appointment) {
    return { ...appointment, services: servicesForAppointment(db, appointment.id) };
  }

  function parseUrl(input) {
    const value = typeof input === 'string' ? input : input?.url || '';
    return new URL(value, 'http://standalone.local');
  }

  function licenseCodeFor(user) {
    return String(user?.email || '').trim();
  }

  function loadLicenseCache() {
    try {
      return JSON.parse(localStorage.getItem(LICENSE_CACHE_KEY) || '{}');
    } catch (_) {
      return {};
    }
  }

  function saveLicenseCache(cache) {
    localStorage.setItem(LICENSE_CACHE_KEY, JSON.stringify(cache));
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
    if (user.billing_type === 'full_payment') {
      return { allowed: true };
    }
    if (isDateExpired(license.vence_em)) {
      return { allowed: false, message: 'Assinatura vencida. Entre em contato com o suporte para renovar.' };
    }
    return { allowed: true };
  }

  function getCachedLicense(code) {
    const cache = loadLicenseCache();
    return cache[code] || null;
  }

  function setCachedLicense(code, license) {
    const cache = loadLicenseCache();
    cache[code] = { ...license, validated_at: now() };
    saveLicenseCache(cache);
  }

  function isInsideGracePeriod(cachedLicense) {
    const validatedAt = cachedLicense?.validated_at ? new Date(cachedLicense.validated_at).getTime() : 0;
    return Number.isFinite(validatedAt) && Date.now() - validatedAt <= LICENSE_GRACE_DAYS * 24 * 60 * 60 * 1000;
  }

  async function fetchRemoteLicense(code) {
    const endpoint = `${SUPABASE_URL}/rest/v1/clientes?codigo_licenca=eq.${encodeURIComponent(code)}&select=nome,codigo_licenca,status,vence_em&limit=1`;
    const response = await originalFetch(endpoint, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
    if (!response.ok) throw new Error(`Falha ao validar licenca (${response.status}).`);
    const licenses = await response.json();
    return licenses[0] || null;
  }

  async function verifyRemoteLicense(user) {
    if (!user || user.role === 'superadmin') return { allowed: true };
    const code = licenseCodeFor(user);
    if (!code) return { allowed: false, message: 'Licenca local sem codigo de acesso.' };

    try {
      const license = await fetchRemoteLicense(code);
      const result = evaluateLicense(user, license);
      if (result.allowed) setCachedLicense(code, license);
      return result;
    } catch (_) {
      const cachedLicense = getCachedLicense(code);
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

  async function handleApi(input, options = {}) {
    const url = parseUrl(input);
    if (!url.pathname.startsWith('/api/')) return originalFetch(input, options);

    const db = loadDb();
    const method = String(options.method || 'GET').toUpperCase();
    const body = parseBody(options);
    const path = url.pathname;

    try {
      if (path === '/api/auth/login' && method === 'POST') {
        const user = db.users.find((item) => (item.email === body.email || item.name === body.email) && item.password === body.password);
        if (!user) return jsonResponse({ message: 'Credenciais inválidas.' }, 401);
        const license = await verifyRemoteLicense(user);
        if (!license.allowed) return jsonResponse({ message: license.message }, 403);
        localStorage.setItem(SESSION_KEY, String(user.id));
        return jsonResponse({ user: billingInfo(user), tenant: tenantFor(db, user) });
      }

      if (path === '/api/auth/logout' && method === 'POST') {
        localStorage.removeItem(SESSION_KEY);
        return jsonResponse({ message: 'Logout realizado.' });
      }

      if (path === '/api/auth/me' && method === 'GET') {
        const session = requireSession(db);
        if (session.error) return jsonResponse(session.error, session.status);
        const license = await verifyRemoteLicense(session.user);
        if (!license.allowed) {
          localStorage.removeItem(SESSION_KEY);
          return jsonResponse({ message: license.message }, 403);
        }
        return jsonResponse({ user: billingInfo(session.user), tenant: tenantFor(db, session.user) });
      }

      if (path === '/api/auth/tenant' && method === 'GET') {
        const session = requireUser(db);
        if (session.error) return jsonResponse(session.error, session.status);
        return jsonResponse({ tenant: tenantFor(db, session.user) });
      }

      if (path === '/api/auth/tenant' && method === 'PUT') {
        const session = requireUser(db);
        if (session.error) return jsonResponse(session.error, session.status);
        const tenant = tenantFor(db, session.user);
        Object.assign(tenant, {
          name: body.name || tenant.name,
          theme_color: body.theme_color || tenant.theme_color,
          border_color: body.border_color || tenant.border_color,
          require_pix_proof_to_finish: Boolean(body.require_pix_proof_to_finish),
        });
        saveDb(db);
        return jsonResponse({ tenant });
      }

      if (path === '/api/admin/users' && method === 'GET') {
        const session = requireSuperadmin(db);
        if (session.error) return jsonResponse(session.error, session.status);
        return jsonResponse({ users: db.users.map((user) => ({ ...billingInfo(user), tenant_name: tenantFor(db, user)?.name || '' })) });
      }

      if (path === '/api/admin/register' && method === 'POST') {
        const session = requireSuperadmin(db);
        if (session.error) return jsonResponse(session.error, session.status);
        if (db.users.some((user) => user.email === body.email)) return jsonResponse({ message: 'Email ja cadastrado.' }, 400);
        const tenant = {
          id: db.next.tenant++,
          name: body.tenantName,
          theme_color: '#d4d4d8',
          border_color: '#3f3f46',
          logo_url: '',
          require_pix_proof_to_finish: false,
          created_at: now(),
        };
        const user = {
          id: db.next.user++,
          tenant_id: tenant.id,
          name: body.name,
          email: body.email,
          password: body.password,
          role: 'user',
          billing_type: body.billingType || 'subscription',
          admin_notes: body.adminNotes || '',
          billing_cycle_started_at: now(),
          billing_paid_at: null,
          billing_proof_name: '',
          billing_proof_data: '',
          created_at: now(),
        };
        db.tenants.push(tenant);
        db.users.push(user);
        saveDb(db);
        return jsonResponse({ user: billingInfo(user), tenant }, 201);
      }

      if (path === '/api/admin/users/admin' && method === 'POST') {
        const session = requireSuperadmin(db);
        if (session.error) return jsonResponse(session.error, session.status);
        if (db.users.some((user) => user.email === body.email)) return jsonResponse({ message: 'Email ja cadastrado.' }, 400);
        const user = {
          id: db.next.user++,
          tenant_id: session.user.tenant_id,
          name: body.name,
          email: body.email,
          password: body.password,
          role: 'superadmin',
          billing_type: 'subscription',
          admin_notes: '',
          billing_cycle_started_at: now(),
          billing_paid_at: null,
          billing_proof_name: '',
          billing_proof_data: '',
          created_at: now(),
        };
        db.users.push(user);
        saveDb(db);
        return jsonResponse({ user: billingInfo(user) }, 201);
      }

      const adminUserMatch = path.match(/^\/api\/admin\/users\/(\d+)$/);
      if (adminUserMatch && method === 'PUT') {
        const session = requireSuperadmin(db);
        if (session.error) return jsonResponse(session.error, session.status);
        const user = db.users.find((item) => item.id === Number(adminUserMatch[1]));
        if (!user) return jsonResponse({ message: 'Usuario nao encontrado.' }, 404);
        Object.assign(user, {
          name: body.name,
          email: body.email,
          role: body.role,
          billing_type: body.billingType || user.billing_type,
          admin_notes: body.adminNotes || '',
        });
        if (body.password) user.password = body.password;
        if (body.billingDays !== undefined && user.role !== 'superadmin') {
          user.billing_cycle_started_at = new Date(Date.now() - Number(body.billingDays || 0) * 24 * 60 * 60 * 1000).toISOString();
          user.billing_paid_at = null;
        }
        saveDb(db);
        return jsonResponse({ user: billingInfo(user) });
      }

      if (adminUserMatch && method === 'DELETE') {
        const session = requireSuperadmin(db);
        if (session.error) return jsonResponse(session.error, session.status);
        const id = Number(adminUserMatch[1]);
        if (id === session.user.id) return jsonResponse({ message: 'Voce nao pode excluir o proprio acesso.' }, 400);
        const user = db.users.find((item) => item.id === id);
        if (!user) return jsonResponse({ message: 'Usuario nao encontrado.' }, 404);
        db.users = db.users.filter((item) => item.id !== id);
        if (!db.users.some((item) => item.tenant_id === user.tenant_id)) {
          db.tenants = db.tenants.filter((item) => item.id !== user.tenant_id);
        }
        saveDb(db);
        return jsonResponse({ message: 'Usuario excluido com sucesso.' });
      }

      const adminBillingMatch = path.match(/^\/api\/admin\/users\/(\d+)\/billing$/);
      if (adminBillingMatch && method === 'PATCH') {
        const session = requireSuperadmin(db);
        if (session.error) return jsonResponse(session.error, session.status);
        const user = db.users.find((item) => item.id === Number(adminBillingMatch[1]));
        if (!user) return jsonResponse({ message: 'Usuario nao encontrado.' }, 404);
        if (body.paid) {
          user.billing_cycle_started_at = now();
          user.billing_paid_at = now();
          user.billing_proof_name = body.billing_proof_name || '';
          user.billing_proof_data = body.billing_proof_data || '';
        } else {
          user.billing_paid_at = null;
          user.billing_proof_name = '';
          user.billing_proof_data = '';
        }
        saveDb(db);
        return jsonResponse({ user: billingInfo(user) });
      }

      if (path === '/api/admin/recommendations' && method === 'GET') {
        const session = requireSuperadmin(db);
        if (session.error) return jsonResponse(session.error, session.status);
        return jsonResponse({ recommendations: db.recommendations.map((item) => ({ ...item, tenant_name: db.tenants.find((tenant) => tenant.id === item.tenant_id)?.name || '' })) });
      }

      const adminRecommendationMatch = path.match(/^\/api\/admin\/recommendations\/(\d+)$/);
      if (adminRecommendationMatch && method === 'DELETE') {
        const session = requireSuperadmin(db);
        if (session.error) return jsonResponse(session.error, session.status);
        db.recommendations = db.recommendations.filter((item) => item.id !== Number(adminRecommendationMatch[1]));
        saveDb(db);
        return jsonResponse({ message: 'Recomendacao excluida com sucesso.' });
      }

      if (path === '/api/admin/bug-reports' && method === 'GET') {
        const session = requireSuperadmin(db);
        if (session.error) return jsonResponse(session.error, session.status);
        return jsonResponse({ reports: db.bugReports.filter((item) => !item.resolved_at).map((item) => ({ ...item, tenant_name: db.tenants.find((tenant) => tenant.id === item.tenant_id)?.name || '' })) });
      }

      const adminBugResolveMatch = path.match(/^\/api\/admin\/bug-reports\/(\d+)\/resolve$/);
      if (adminBugResolveMatch && method === 'PATCH') {
        const session = requireSuperadmin(db);
        if (session.error) return jsonResponse(session.error, session.status);
        const report = db.bugReports.find((item) => item.id === Number(adminBugResolveMatch[1]));
        if (!report) return jsonResponse({ message: 'Report de bug nao encontrado.' }, 404);
        report.resolved_at = now();
        report.resolution_message = `Obrigado pelo seu relato, ${report.client_name}. O bug informado na barbearia ${report.barbershop_name} foi resolvido.`;
        saveDb(db);
        return jsonResponse({ report });
      }

      const userSession = requireUser(db);
      if (userSession.error) return jsonResponse(userSession.error, userSession.status);
      const tenantId = userSession.user.tenant_id;

      if (path === '/api/clients') {
        if (method === 'GET') return jsonResponse({ clients: db.clients.filter((item) => item.tenant_id === tenantId).sort((a, b) => a.name.localeCompare(b.name)) });
        if (method === 'POST') {
          const client = { id: db.next.client++, tenant_id: tenantId, name: body.name, phone: body.phone || '', notes: body.notes || '', created_at: now() };
          db.clients.push(client);
          saveDb(db);
          return jsonResponse({ client }, 201);
        }
      }

      const clientMatch = path.match(/^\/api\/clients\/(\d+)$/);
      if (clientMatch) {
        const client = db.clients.find((item) => item.id === Number(clientMatch[1]) && item.tenant_id === tenantId);
        if (!client) return jsonResponse({ message: 'Cliente nao encontrado.' }, 404);
        if (method === 'PUT') {
          Object.assign(client, { name: body.name, phone: body.phone || '', notes: body.notes || '' });
          saveDb(db);
          return jsonResponse({ client });
        }
        if (method === 'DELETE') {
          db.clients = db.clients.filter((item) => item.id !== client.id);
          saveDb(db);
          return jsonResponse({ message: 'Cliente removido.' });
        }
      }

      if (path === '/api/services') {
        if (method === 'GET') return jsonResponse({ services: db.services.filter((item) => item.tenant_id === tenantId).sort((a, b) => a.name.localeCompare(b.name)) });
        if (method === 'POST') {
          const service = { id: db.next.service++, tenant_id: tenantId, name: body.name, price: Number(body.price || 0), description: body.description || '', created_at: now() };
          db.services.push(service);
          saveDb(db);
          return jsonResponse({ service }, 201);
        }
      }

      const serviceMatch = path.match(/^\/api\/services\/(\d+)$/);
      if (serviceMatch) {
        const service = db.services.find((item) => item.id === Number(serviceMatch[1]) && item.tenant_id === tenantId);
        if (!service) return jsonResponse({ message: 'Servico nao encontrado.' }, 404);
        if (method === 'PUT') {
          Object.assign(service, { name: body.name, price: Number(body.price || 0), description: body.description || '' });
          saveDb(db);
          return jsonResponse({ service });
        }
        if (method === 'DELETE') {
          db.services = db.services.filter((item) => item.id !== service.id);
          saveDb(db);
          return jsonResponse({ message: 'Servico removido.' });
        }
      }

      if (path === '/api/appointments/history' && method === 'GET') {
        return jsonResponse({ history: db.serviceHistory.filter((item) => item.tenant_id === tenantId).sort((a, b) => String(b.completed_at).localeCompare(String(a.completed_at))) });
      }

      if (path === '/api/appointments') {
        if (method === 'GET') return jsonResponse({ appointments: db.appointments.filter((item) => item.tenant_id === tenantId).map((item) => withAppointmentServices(db, item)) });
        if (method === 'POST') {
          const services = db.services.filter((item) => item.tenant_id === tenantId && body.service_ids.includes(item.id));
          const appointment = {
            id: db.next.appointment++,
            tenant_id: tenantId,
            client_id: Number(body.client_id),
            appointment_date: body.appointment_date,
            total: services.reduce((sum, service) => sum + Number(service.price || 0), 0),
            payment_type: body.payment_type || 'dinheiro',
            payment_status: body.payment_status || 'a pagar',
            payment_proof_name: body.payment_proof_name || '',
            payment_proof_data: body.payment_proof_data || '',
            note_attachment_name: body.note_attachment_name || '',
            note_attachment_data: body.note_attachment_data || '',
            notes: body.notes || '',
            service_ids: body.service_ids.map(Number),
            created_at: now(),
          };
          db.appointments.push(appointment);
          saveDb(db);
          return jsonResponse({ appointment: withAppointmentServices(db, appointment) }, 201);
        }
      }

      const appointmentMatch = path.match(/^\/api\/appointments\/(\d+)$/);
      if (appointmentMatch) {
        const appointment = db.appointments.find((item) => item.id === Number(appointmentMatch[1]) && item.tenant_id === tenantId);
        if (!appointment) return jsonResponse({ message: 'Agendamento nao encontrado.' }, 404);
        if (method === 'PUT') {
          const services = db.services.filter((item) => item.tenant_id === tenantId && body.service_ids.includes(item.id));
          Object.assign(appointment, {
            client_id: Number(body.client_id),
            appointment_date: body.appointment_date,
            total: services.reduce((sum, service) => sum + Number(service.price || 0), 0),
            payment_type: body.payment_type || 'dinheiro',
            payment_status: body.payment_status || 'a pagar',
            payment_proof_name: body.payment_proof_name || '',
            payment_proof_data: body.payment_proof_data || '',
            note_attachment_name: body.note_attachment_name || '',
            note_attachment_data: body.note_attachment_data || '',
            notes: body.notes || '',
            service_ids: body.service_ids.map(Number),
          });
          saveDb(db);
          return jsonResponse({ appointment: withAppointmentServices(db, appointment) });
        }
        if (method === 'DELETE') {
          db.appointments = db.appointments.filter((item) => item.id !== appointment.id);
          saveDb(db);
          return jsonResponse({ message: 'Agendamento removido.' });
        }
      }

      const finishMatch = path.match(/^\/api\/appointments\/(\d+)\/finish$/);
      if (finishMatch && method === 'POST') {
        const appointment = db.appointments.find((item) => item.id === Number(finishMatch[1]) && item.tenant_id === tenantId);
        if (!appointment) return jsonResponse({ message: 'Agendamento nao encontrado.' }, 404);
        const tenant = tenantFor(db, userSession.user);
        if (tenant?.require_pix_proof_to_finish && appointment.payment_type === 'pix' && (appointment.payment_status !== 'ja pago' || !appointment.payment_proof_data)) {
          return jsonResponse({ message: 'Para finalizar trabalho pago via PIX, marque como ja pago e anexe o comprovante no agendamento.' }, 400);
        }
        const client = db.clients.find((item) => item.id === appointment.client_id);
        const history = {
          id: db.next.history++,
          tenant_id: tenantId,
          appointment_id: appointment.id,
          client_name: client?.name || '',
          client_phone: client?.phone || '',
          appointment_date: appointment.appointment_date,
          total: appointment.total,
          payment_type: appointment.payment_type,
          payment_status: appointment.payment_status,
          payment_proof_name: appointment.payment_proof_name,
          payment_proof_data: appointment.payment_proof_data,
          note_attachment_name: appointment.note_attachment_name,
          note_attachment_data: appointment.note_attachment_data,
          notes: appointment.notes,
          services: servicesForAppointment(db, appointment.id),
          completed_at: now(),
        };
        db.serviceHistory.push(history);
        db.appointments = db.appointments.filter((item) => item.id !== appointment.id);
        saveDb(db);
        return jsonResponse({ history }, 201);
      }

      if (path === '/api/recommendations' && method === 'POST') {
        const recommendation = { id: db.next.recommendation++, tenant_id: tenantId, user_id: userSession.user.id, ...body, created_at: now() };
        db.recommendations.push(recommendation);
        saveDb(db);
        return jsonResponse({ recommendation }, 201);
      }

      if (path === '/api/bug-reports') {
        if (method === 'GET') return jsonResponse({ reports: db.bugReports.filter((item) => item.tenant_id === tenantId && item.user_id === userSession.user.id) });
        if (method === 'POST') {
          const bugReport = { id: db.next.bugReport++, tenant_id: tenantId, user_id: userSession.user.id, resolved_at: null, resolution_message: '', ...body, created_at: now() };
          db.bugReports.push(bugReport);
          saveDb(db);
          return jsonResponse({ bugReport }, 201);
        }
      }

      return jsonResponse({ message: 'Rota local nao implementada.' }, 404);
    } catch (error) {
      return jsonResponse({ message: error.message || 'Erro local.' }, 500);
    }
  }

  window.fetch = handleApi;
})();
