const state = {
  user: null,
  tenant: null,
  clients: [],
  services: [],
  appointments: [],
  serviceHistory: [],
  bugReports: [],
  editing: { client: null, service: null, appointment: null },
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
}

// --- API Helpers ---
async function apiFetch(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {},
    credentials: 'include',
  };
  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(endpoint, options);
  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    // Se a resposta não tiver JSON, continuamos com um erro genérico.
  }

  if (!response.ok) {
    throw new Error(data?.message || `Erro ${response.status}: ${response.statusText}`);
  }

  return data;
}

// --- DOM Elements ---
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const tenantNameTitle = document.getElementById('tenant-name');
const logoutButton = document.getElementById('logout-button');
const billingRenewalModal = document.getElementById('billing-renewal-modal');
const billingRenewalMessage = document.getElementById('billing-renewal-message');
const billingRenewalClose = document.getElementById('billing-renewal-close');

const loginCard = document.getElementById('login-card');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');

const navButtons = document.querySelectorAll('.nav-button');
const sectionPanels = document.querySelectorAll('.panel');

const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const menuToggle = document.getElementById('menu-toggle');
const closeSidebar = document.getElementById('close-sidebar');

const clientsTable = document.getElementById('clients-table');
const servicesTable = document.getElementById('services-table');
const appointmentsTable = document.getElementById('appointments-table');
const historyTable = document.getElementById('history-table');
const bugReportsTable = document.getElementById('bug-reports-table');
const appointmentClient = document.getElementById('appointment-client');
const appointmentServices = document.getElementById('appointment-services');
const appointmentTotal = document.getElementById('appointment-total');
const appointmentFilterDate = document.getElementById('appointment-filter-date');
const appointmentFilterTime = document.getElementById('appointment-filter-time');
const appointmentFilterMinValue = document.getElementById('appointment-filter-min-value');
const appointmentFilterMaxValue = document.getElementById('appointment-filter-max-value');
const appointmentFilterService = document.getElementById('appointment-filter-service');
const appointmentFilterPaymentStatus = document.getElementById('appointment-filter-payment-status');
const clearAppointmentFiltersButton = document.getElementById('clear-appointment-filters');
const historyFilterClient = document.getElementById('history-filter-client');
const historyFilterDate = document.getElementById('history-filter-date');
const historyFilterTime = document.getElementById('history-filter-time');
const historyFilterMinValue = document.getElementById('history-filter-min-value');
const historyFilterMaxValue = document.getElementById('history-filter-max-value');
const historyFilterService = document.getElementById('history-filter-service');
const historyFilterPaymentType = document.getElementById('history-filter-payment-type');
const clearHistoryFiltersButton = document.getElementById('clear-history-filters');

const clientForm = document.getElementById('client-form');
const serviceForm = document.getElementById('service-form');
const appointmentForm = document.getElementById('appointment-form');
const bugForm = document.getElementById('bug-form');
const bugMessage = document.getElementById('bug-message');

const newClientButton = document.getElementById('new-client');
const cancelClientButton = document.getElementById('cancel-client');
const newServiceButton = document.getElementById('new-service');
const cancelServiceButton = document.getElementById('cancel-service');
const newAppointmentButton = document.getElementById('new-appointment');
const cancelAppointmentButton = document.getElementById('cancel-appointment');

// --- Settings ---
const settingsPanel = document.getElementById('settings-panel');
const settingsForm = document.getElementById('settings-form');
const settingsMessage = document.getElementById('settings-message');
const tenantNameInput = document.getElementById('tenant-name-input');
const primaryColorInput = document.getElementById('primary-color-input');
const borderColorInput = document.getElementById('border-color-input');
const recommendationForm = document.getElementById('recommendation-form');
const recommendationMessage = document.getElementById('recommendation-message');
const recommendationClientName = document.getElementById('recommendation-client-name');
const recommendationBarbershopName = document.getElementById('recommendation-barbershop-name');
const recommendationText = document.getElementById('recommendation-text');

const DEFAULT_PRIMARY_COLOR = '#d4d4d8';
const LEGACY_DEFAULT_PRIMARY_COLOR = '#1a73e8';
const DEFAULT_BORDER_COLOR = '#3f3f46';

// --- Layout & Navigation ---
function toggleSidebar() {
  if (sidebar) sidebar.classList.toggle('open');
  if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
}

function setSection(targetId) {
  sectionPanels.forEach((section) => {
    section.classList.toggle('hidden', section.id !== targetId);
    const button = document.querySelector(`.nav-button[data-section="${section.id}"]`);
    if (button) button.classList.toggle('active', section.id === targetId);
  });
  if (sidebar && sidebar.classList.contains('open')) {
    toggleSidebar();
  }
}

function showApp() {
  authSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  if (state.tenant) {
    tenantNameTitle.textContent = state.tenant.name;
  }
  showBillingRenewalModal();
}

function showAuth() {
  authSection.classList.remove('hidden');
  appSection.classList.add('hidden');
}

function showBillingRenewalModal() {
  if (!billingRenewalModal || !billingRenewalMessage || !state.user?.show_billing_charge) return;
  billingRenewalMessage.textContent = `Sua assinatura atingiu ${state.user.billing_days || 30} dias de uso. Entre em contato com o administrador para renovar o acesso da barbearia.`;
  billingRenewalModal.classList.remove('hidden');
}

function hideBillingRenewalModal() {
  if (billingRenewalModal) billingRenewalModal.classList.add('hidden');
}

function applyHudColors({ primaryColor, borderColor }) {
  if (primaryColor && primaryColor !== LEGACY_DEFAULT_PRIMARY_COLOR) {
    document.documentElement.style.setProperty('--primary-color', primaryColor);
  } else {
    document.documentElement.style.removeProperty('--primary-color');
  }

  if (borderColor && borderColor !== DEFAULT_BORDER_COLOR) {
    document.documentElement.style.setProperty('--border-color', borderColor);
  } else {
    document.documentElement.style.removeProperty('--border-color');
  }
}


// --- Form Resets ---
function resetClientForm() {
  state.editing.client = null;
  clientForm.reset();
  clientForm.classList.add('hidden');
  document.getElementById('client-id').value = '';
}

function resetServiceForm() {
  state.editing.service = null;
  serviceForm.reset();
  serviceForm.classList.add('hidden');
  document.getElementById('service-id').value = '';
}

function resetAppointmentForm() {
  state.editing.appointment = null;
  appointmentForm.reset();
  appointmentForm.classList.add('hidden');
  document.getElementById('appointment-id').value = '';
  setDefaultAppointmentDateTime();
  appointmentTotal.textContent = 'R$ 0,00';
}

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getPaymentTypeLabel(paymentType) {
  const labels = {
    'dinheiro': 'Dinheiro',
    'pix': 'PIX',
    'debito': 'Débito',
    'credito': 'Crédito'
  };
  return labels[paymentType] || 'Dinheiro';
}

function getPaymentStatusLabel(paymentStatus) {
  return paymentStatus === 'ja pago' ? 'Já pago' : 'A pagar';
}

function normalizeAppointmentDate(value) {
  if (!value) return '';
  const raw = String(value);
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2})/);
  if (match) return `${match[1]}T${match[2]}`;
  return raw.slice(0, 16);
}

function getDefaultAppointmentDateTime() {
  const date = new Date();
  date.setHours(7, 0, 0, 0);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T07:00`;
}

function setDefaultAppointmentDateTime() {
  const appointmentDateInput = document.getElementById('appointment-date');
  if (appointmentDateInput) appointmentDateInput.value = getDefaultAppointmentDateTime();
}

function getAppointmentTotal(appointment) {
  return Number(appointment.total_price ?? appointment.total ?? 0);
}

function formatDateTime(value) {
  const normalized = normalizeAppointmentDate(value);
  if (!normalized) return '-';
  const [datePart, timePart] = normalized.split('T');
  if (!datePart || !timePart) return normalized;
  const [year, month, day] = datePart.split('-');
  return `${day}/${month}/${year}, ${timePart}`;
}

function getFilteredAppointments() {
  const selectedDate = appointmentFilterDate?.value || '';
  const selectedTime = appointmentFilterTime?.value || '';
  const minValue = appointmentFilterMinValue?.value ? Number(appointmentFilterMinValue.value) : null;
  const maxValue = appointmentFilterMaxValue?.value ? Number(appointmentFilterMaxValue.value) : null;
  const serviceId = appointmentFilterService?.value ? Number(appointmentFilterService.value) : null;
  const paymentStatus = appointmentFilterPaymentStatus?.value || '';

  return state.appointments.filter((appointment) => {
    const appointmentDate = normalizeAppointmentDate(appointment.appointment_date).slice(0, 10);
    const appointmentTime = normalizeAppointmentDate(appointment.appointment_date).slice(11, 16);
    const total = getAppointmentTotal(appointment);
    const services = appointment.services || [];
    const hasService = !serviceId || services.some((service) => Number(service.service_id || service.id) === serviceId);
    const currentStatus = appointment.payment_status || 'a pagar';

    return (!selectedDate || appointmentDate === selectedDate)
      && (!selectedTime || appointmentTime === selectedTime)
      && (minValue === null || total >= minValue)
      && (maxValue === null || total <= maxValue)
      && hasService
      && (!paymentStatus || currentStatus === paymentStatus);
  });
}

function getHistoryServices(historyItem) {
  if (Array.isArray(historyItem.services)) return historyItem.services;
  if (!historyItem.services) return [];
  try {
    const parsed = JSON.parse(historyItem.services);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function getFilteredServiceHistory() {
  const clientName = historyFilterClient?.value || '';
  const selectedDate = historyFilterDate?.value || '';
  const selectedTime = historyFilterTime?.value || '';
  const minValue = historyFilterMinValue?.value ? Number(historyFilterMinValue.value) : null;
  const maxValue = historyFilterMaxValue?.value ? Number(historyFilterMaxValue.value) : null;
  const serviceId = historyFilterService?.value ? Number(historyFilterService.value) : null;
  const paymentType = historyFilterPaymentType?.value || '';

  return state.serviceHistory.filter((item) => {
    const historyDate = normalizeAppointmentDate(item.appointment_date).slice(0, 10);
    const historyTime = normalizeAppointmentDate(item.appointment_date).slice(11, 16);
    const total = getAppointmentTotal(item);
    const services = getHistoryServices(item);
    const hasService = !serviceId || services.some((service) => Number(service.service_id || service.id) === serviceId);
    const currentPaymentType = item.payment_type || 'dinheiro';

    return (!clientName || item.client_name === clientName)
      && (!selectedDate || historyDate === selectedDate)
      && (!selectedTime || historyTime === selectedTime)
      && (minValue === null || total >= minValue)
      && (maxValue === null || total <= maxValue)
      && hasService
      && (!paymentType || currentPaymentType === paymentType);
  });
}

function hasAppointmentScheduleConflict(appointmentDate, currentAppointmentId = null) {
  const normalizedDate = normalizeAppointmentDate(appointmentDate);
  return state.appointments.some((appointment) => {
    if (currentAppointmentId && Number(appointment.id) === Number(currentAppointmentId)) return false;
    return normalizeAppointmentDate(appointment.appointment_date) === normalizedDate;
  });
}

function updateTotals() {
  const checked = appointmentServices.querySelectorAll('input[type="checkbox"]:checked');
  const total = Array.from(checked).reduce((sum, checkbox) => sum + Number(checkbox.dataset.price), 0);
  appointmentTotal.textContent = formatCurrency(total);
}

// --- Render Functions ---
function renderClients() {
  clientsTable.innerHTML = state.clients.map((client) => `
    <tr>
      <td>${escapeHtml(client.name)}</td>
      <td>${escapeHtml(client.phone || '-')}</td>
      <td>${escapeHtml(client.notes || '-')}</td>
      <td class="actions">
        <div class="action-buttons">
          <button class="button-secondary" data-action="edit-client" data-id="${client.id}">Editar</button>
          <button class="button-secondary" data-action="delete-client" data-id="${client.id}">Remover</button>
        </div>
      </td>
    </tr>`).join('');
}

function renderServices() {
  servicesTable.innerHTML = state.services.map((service) => `
    <tr>
      <td>${escapeHtml(service.name)}</td>
      <td>${formatCurrency(service.price)}</td>
      <td>${escapeHtml(service.description || '-')}</td>
      <td class="actions">
        <div class="action-buttons">
          <button class="button-secondary" data-action="edit-service" data-id="${service.id}">Editar</button>
          <button class="button-secondary" data-action="delete-service" data-id="${service.id}">Remover</button>
        </div>
      </td>
    </tr>`).join('');
}

function renderAppointments() {
  const appointments = getFilteredAppointments();

  if (!appointments.length) {
    appointmentsTable.innerHTML = '<tr><td colspan="6">Nenhum agendamento encontrado.</td></tr>';
    return;
  }

  appointmentsTable.innerHTML = appointments.map((appointment) => {
    const client = state.clients.find(c => c.id === appointment.client_id);
    const clientName = client ? client.name : 'Cliente não encontrado';
    const servicesText = appointment.services ? appointment.services.map(s => s.service_name || s.name).join(', ') : '-';
    const totalPrice = getAppointmentTotal(appointment);
    const paymentStatus = appointment.payment_status || 'a pagar';

    return `
    <tr>
      <td>${escapeHtml(clientName)}</td>
      <td>${formatDateTime(appointment.appointment_date)}</td>
      <td>${escapeHtml(servicesText)}</td>
      <td>${formatCurrency(totalPrice)}</td>
      <td>
        ${getPaymentTypeLabel(appointment.payment_type || 'dinheiro')}
        <span class="payment-status">${getPaymentStatusLabel(paymentStatus)}</span>
      </td>
      <td class="actions">
        <div class="action-buttons">
          <button class="button-secondary" data-action="edit-appointment" data-id="${appointment.id}">Editar</button>
          <button class="button-secondary" data-action="finish-appointment" data-id="${appointment.id}">Trabalho finalizado</button>
          <button class="button-secondary" data-action="delete-appointment" data-id="${appointment.id}">Remover</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function renderServiceHistory() {
  if (!historyTable) return;
  const history = getFilteredServiceHistory();

  if (!history.length) {
    historyTable.innerHTML = '<tr><td colspan="6">Nenhum serviço finalizado encontrado.</td></tr>';
    return;
  }

  historyTable.innerHTML = history.map((item) => {
    const services = getHistoryServices(item);
    const servicesText = services.length ? services.map((service) => service.service_name || service.name).join(', ') : '-';
    const totalPrice = getAppointmentTotal(item);

    return `
    <tr>
      <td>${escapeHtml(item.client_name)}</td>
      <td>${formatDateTime(item.appointment_date)}</td>
      <td>${escapeHtml(servicesText)}</td>
      <td>${formatCurrency(totalPrice)}</td>
      <td>${getPaymentTypeLabel(item.payment_type || 'dinheiro')}</td>
      <td>${formatDateTime(item.completed_at)}</td>
    </tr>`;
  }).join('');
}

function renderBugReports() {
  if (!bugReportsTable) return;
  if (!state.bugReports.length) {
    bugReportsTable.innerHTML = '<tr><td colspan="3">Nenhum relato enviado ainda.</td></tr>';
    return;
  }

  bugReportsTable.innerHTML = state.bugReports.map((report) => `
    <tr>
      <td>${escapeHtml(report.description)}</td>
      <td>${report.resolved_at ? 'Resolvido' : 'Em analise'}</td>
      <td>${escapeHtml(report.resolution_message || '-')}</td>
    </tr>
  `).join('');
}

function fillAppointmentServices() {
  appointmentServices.innerHTML = state.services.map((service) => `
    <label class="checkbox-item">
      <input type="checkbox" value="${service.id}" data-price="${service.price}" />
      <span>${escapeHtml(service.name)} - ${formatCurrency(service.price)}</span>
    </label>`).join('');
  appointmentServices.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', updateTotals);
  });
}

function fillAppointmentServiceFilter() {
  if (!appointmentFilterService) return;
  const selectedValue = appointmentFilterService.value;
  appointmentFilterService.innerHTML = '<option value="">Todos</option>' + state.services.map((service) => (
    `<option value="${service.id}">${escapeHtml(service.name)}</option>`
  )).join('');
  appointmentFilterService.value = selectedValue;
}

function fillHistoryServiceFilter() {
  if (!historyFilterService) return;
  const selectedValue = historyFilterService.value;
  historyFilterService.innerHTML = '<option value="">Todos</option>' + state.services.map((service) => (
    `<option value="${service.id}">${escapeHtml(service.name)}</option>`
  )).join('');
  historyFilterService.value = selectedValue;
}

function fillHistoryClientFilter() {
  if (!historyFilterClient) return;
  const selectedValue = historyFilterClient.value;
  const clientNames = Array.from(new Set(
    state.serviceHistory
      .map((item) => item.client_name)
      .filter(Boolean)
  )).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  historyFilterClient.innerHTML = '<option value="">Todos</option>' + clientNames.map((name) => (
    `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`
  )).join('');
  historyFilterClient.value = selectedValue;
}

function fillClientSelect() {
  appointmentClient.innerHTML = state.clients.map((client) => `<option value="${client.id}">${escapeHtml(client.name)}</option>`).join('');
}

// --- Data Loading ---
async function loadAppData() {
  try {
    const [clientsRes, servicesRes, appointmentsRes, historyRes, bugReportsRes] = await Promise.all([
      apiFetch('/api/clients'),
      apiFetch('/api/services'),
      apiFetch('/api/appointments'),
      apiFetch('/api/appointments/history'),
      apiFetch('/api/bug-reports')
    ]);
    
    state.clients = clientsRes.clients || [];
    state.services = servicesRes.services || [];
    state.appointments = appointmentsRes.appointments || [];
    state.serviceHistory = historyRes.history || [];
    state.bugReports = bugReportsRes.reports || [];

    renderClients();
    renderServices();
    renderAppointments();
    renderServiceHistory();
    renderBugReports();
    fillClientSelect();
    fillAppointmentServices();
    fillAppointmentServiceFilter();
    fillHistoryClientFilter();
    fillHistoryServiceFilter();
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    alert('Erro ao sincronizar dados com o servidor.');
  }
}

// --- Auth Handlers ---
async function handleLogin(event) {
  event.preventDefault();
  loginMessage.textContent = 'Autenticando...';
  try {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    const data = await apiFetch('/api/auth/login', 'POST', { email, password });
    state.user = data.user;
    state.tenant = data.tenant;
    
    loginForm.reset();
    loginMessage.textContent = '';
    showApp();
    await loadAppData();
  } catch (error) {
    loginMessage.textContent = error.message;
  }
}

async function handleLogout() {
  try {
    await apiFetch('/api/auth/logout', 'POST');
    state.user = null;
    state.tenant = null;
    showAuth();
  } catch (error) {
    console.error('Logout failed:', error);
  }
}

// --- Submit Handlers ---
async function handleClientSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('client-id').value;
  const name = document.getElementById('client-name').value.trim();
  const phone = document.getElementById('client-phone').value.trim();
  const notes = document.getElementById('client-notes').value.trim();
  if (!name) return;

  const payload = { name, phone, notes };

  try {
    if (id) {
      await apiFetch(`/api/clients/${id}`, 'PUT', payload);
    } else {
      await apiFetch('/api/clients', 'POST', payload);
    }
    await loadAppData(); // Recarrega os dados do servidor
    resetClientForm();
  } catch (error) {
    alert(error.message);
  }
}

async function handleServiceSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('service-id').value;
  const name = document.getElementById('service-name').value.trim();
  const price = parseFloat(document.getElementById('service-price').value);
  const description = document.getElementById('service-description').value.trim();
  if (!name || Number.isNaN(price)) return;

  const payload = { name, price, description };

  try {
    if (id) {
      await apiFetch(`/api/services/${id}`, 'PUT', payload);
    } else {
      await apiFetch('/api/services', 'POST', payload);
    }
    await loadAppData();
    resetServiceForm();
  } catch (error) {
    alert(error.message);
  }
}

function readCheckedServiceIds() {
  return Array.from(appointmentServices.querySelectorAll('input[type="checkbox"]:checked')).map((checkbox) => Number(checkbox.value));
}

async function handleAppointmentSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('appointment-id').value;
  const client_id = Number(appointmentClient.value);
  const appointment_date = document.getElementById('appointment-date').value;
  const notes = document.getElementById('appointment-notes').value.trim();
  const service_ids = readCheckedServiceIds();
  const payment_type = document.getElementById('appointment-payment-type').value;
  const payment_status = document.getElementById('appointment-payment-status').value;
  
  if (!client_id || !appointment_date || !service_ids.length) {
    alert('Por favor, preencha o cliente, a data e selecione pelo menos um serviço.');
    return;
  }

  if (hasAppointmentScheduleConflict(appointment_date, id)) {
    const shouldContinue = confirm('Já existe um agendamento neste mesmo dia e horário. Deseja mesmo agendar no mesmo dia/horário?');
    if (!shouldContinue) return;
  }

  const payload = { client_id, appointment_date, service_ids, payment_type, payment_status, notes };

  try {
    if (id) {
      await apiFetch(`/api/appointments/${id}`, 'PUT', payload);
    } else {
      await apiFetch('/api/appointments', 'POST', payload);
    }
    await loadAppData();
    resetAppointmentForm();
  } catch (error) {
    alert(error.message);
  }
}

async function handleBugSubmit(event) {
  event.preventDefault();
  if (bugMessage) bugMessage.textContent = 'Enviando relato...';
  const clientName = document.getElementById('bug-client-name').value.trim();
  const barbershopName = document.getElementById('bug-barbershop-name').value.trim();
  const description = document.getElementById('bug-description').value.trim();

  if (!clientName || !barbershopName || !description) {
    if (bugMessage) bugMessage.textContent = 'Preencha nome, barbearia e descricao do problema.';
    return;
  }

  try {
    const data = await apiFetch('/api/bug-reports', 'POST', {
      client_name: clientName,
      barbershop_name: barbershopName,
      description,
    });

    if (data?.bugReport) {
      bugForm.reset();
      if (state.user?.name) document.getElementById('bug-client-name').value = state.user.name;
      if (state.tenant?.name) document.getElementById('bug-barbershop-name').value = state.tenant.name;
      if (bugMessage) bugMessage.textContent = 'Relato enviado com sucesso! Nossa equipe analisara o problema.';
      await loadAppData();
    }
  } catch (error) {
    if (bugMessage) bugMessage.textContent = error.message;
  }
}

// --- Open Forms ---
function openClientForm(client = null) {
  if (client) {
    document.getElementById('client-id').value = client.id;
    document.getElementById('client-name').value = client.name;
    document.getElementById('client-phone').value = client.phone || '';
    document.getElementById('client-notes').value = client.notes || '';
    state.editing.client = client.id;
  } else {
    clientForm.reset();
    state.editing.client = null;
  }
  clientForm.classList.remove('hidden');
}

function openServiceForm(service = null) {
  if (service) {
    document.getElementById('service-id').value = service.id;
    document.getElementById('service-name').value = service.name;
    document.getElementById('service-price').value = service.price;
    document.getElementById('service-description').value = service.description || '';
    state.editing.service = service.id;
  } else {
    serviceForm.reset();
    state.editing.service = null;
  }
  serviceForm.classList.remove('hidden');
}

function openAppointmentForm(appointment = null) {
  if (appointment) {
    document.getElementById('appointment-id').value = appointment.id;
    appointmentClient.value = appointment.client_id;
    
    document.getElementById('appointment-date').value = normalizeAppointmentDate(appointment.appointment_date);
    
    document.getElementById('appointment-notes').value = appointment.notes || '';
    document.getElementById('appointment-payment-type').value = appointment.payment_type || 'dinheiro';
    document.getElementById('appointment-payment-status').value = appointment.payment_status || 'a pagar';
    
    const apptServiceIds = appointment.services ? appointment.services.map(s => s.service_id || s.id) : [];
    appointmentServices.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = apptServiceIds.includes(Number(checkbox.value));
    });
    state.editing.appointment = appointment.id;
  } else {
    appointmentForm.reset();
    setDefaultAppointmentDateTime();
    document.getElementById('appointment-payment-status').value = 'a pagar';
    state.editing.appointment = null;
  }
  updateTotals();
  appointmentForm.classList.remove('hidden');
}

// --- Table Actions ---
async function handleTableClick(event) {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;
  if (!action || !id) return;

  try {
    if (action === 'edit-client') {
      const client = state.clients.find((item) => item.id === Number(id));
      if (client) openClientForm(client);
    }
    if (action === 'delete-client') {
      if (confirm('Tem certeza que deseja remover este cliente?')) {
        await apiFetch(`/api/clients/${id}`, 'DELETE');
        await loadAppData();
      }
    }
    
    if (action === 'edit-service') {
      const service = state.services.find((item) => item.id === Number(id));
      if (service) openServiceForm(service);
    }
    if (action === 'delete-service') {
      if (confirm('Tem certeza que deseja remover este serviço?')) {
        await apiFetch(`/api/services/${id}`, 'DELETE');
        await loadAppData();
      }
    }
    
    if (action === 'edit-appointment') {
      const appointment = state.appointments.find((item) => item.id === Number(id));
      if (appointment) openAppointmentForm(appointment);
    }
    if (action === 'delete-appointment') {
      if (confirm('Tem certeza que deseja remover este agendamento?')) {
        await apiFetch(`/api/appointments/${id}`, 'DELETE');
        await loadAppData();
      }
    }
    if (action === 'finish-appointment') {
      if (confirm('Marcar este trabalho como finalizado? O agendamento será removido da lista.')) {
        await apiFetch(`/api/appointments/${id}/finish`, 'POST');
        await loadAppData();
      }
    }
  } catch (error) {
    alert(error.message);
  }
}

function bindEvents() {
  loginForm.addEventListener('submit', handleLogin);
  logoutButton.addEventListener('click', handleLogout);
  if (billingRenewalClose) billingRenewalClose.addEventListener('click', hideBillingRenewalModal);
  
  if (menuToggle) menuToggle.addEventListener('click', toggleSidebar);
  if (closeSidebar) closeSidebar.addEventListener('click', toggleSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);
  
  clientForm.addEventListener('submit', handleClientSubmit);
  serviceForm.addEventListener('submit', handleServiceSubmit);
  appointmentForm.addEventListener('submit', handleAppointmentSubmit);
  if (bugForm) bugForm.addEventListener('submit', handleBugSubmit);
  
  newClientButton.addEventListener('click', () => openClientForm());
  cancelClientButton.addEventListener('click', resetClientForm);
  
  newServiceButton.addEventListener('click', () => openServiceForm());
  cancelServiceButton.addEventListener('click', resetServiceForm);
  
  newAppointmentButton.addEventListener('click', () => openAppointmentForm());
  cancelAppointmentButton.addEventListener('click', resetAppointmentForm);
  
  clientsTable.addEventListener('click', handleTableClick);
  servicesTable.addEventListener('click', handleTableClick);
  appointmentsTable.addEventListener('click', handleTableClick);
  
  appointmentServices.addEventListener('change', updateTotals);
  [appointmentFilterDate, appointmentFilterTime, appointmentFilterMinValue, appointmentFilterMaxValue, appointmentFilterService, appointmentFilterPaymentStatus]
    .filter(Boolean)
    .forEach((filter) => filter.addEventListener('input', renderAppointments));
  if (clearAppointmentFiltersButton) {
    clearAppointmentFiltersButton.addEventListener('click', () => {
      if (appointmentFilterDate) appointmentFilterDate.value = '';
      if (appointmentFilterTime) appointmentFilterTime.value = '';
      if (appointmentFilterMinValue) appointmentFilterMinValue.value = '';
      if (appointmentFilterMaxValue) appointmentFilterMaxValue.value = '';
      if (appointmentFilterService) appointmentFilterService.value = '';
      if (appointmentFilterPaymentStatus) appointmentFilterPaymentStatus.value = '';
      renderAppointments();
    });
  }
  [historyFilterClient, historyFilterDate, historyFilterTime, historyFilterMinValue, historyFilterMaxValue, historyFilterService, historyFilterPaymentType]
    .filter(Boolean)
    .forEach((filter) => filter.addEventListener('input', renderServiceHistory));
  if (clearHistoryFiltersButton) {
    clearHistoryFiltersButton.addEventListener('click', () => {
      if (historyFilterClient) historyFilterClient.value = '';
      if (historyFilterDate) historyFilterDate.value = '';
      if (historyFilterTime) historyFilterTime.value = '';
      if (historyFilterMinValue) historyFilterMinValue.value = '';
      if (historyFilterMaxValue) historyFilterMaxValue.value = '';
      if (historyFilterService) historyFilterService.value = '';
      if (historyFilterPaymentType) historyFilterPaymentType.value = '';
      renderServiceHistory();
    });
  }
  navButtons.forEach((button) => button.addEventListener('click', () => setSection(button.dataset.section)));
  
  // Botão Admin na página de login
  const adminAccessBtn = document.getElementById('admin-access-btn');
  if (adminAccessBtn) adminAccessBtn.addEventListener('click', () => window.location.href = 'admin.html');
  
  // Toggle Password
  const togglePasswordBtns = document.querySelectorAll('.toggle-password');
  togglePasswordBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input.type === 'password') {
        input.type = 'text';
        this.classList.remove('ph-eye');
        this.classList.add('ph-eye-slash');
      } else {
        input.type = 'password';
        this.classList.remove('ph-eye-slash');
        this.classList.add('ph-eye');
      }
    });
  });
  
  // Theme Toggle
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    const htmlEl = document.documentElement;
    const savedTheme = localStorage.getItem('barber_theme') || 'dark';
    
    if (savedTheme === 'light') {
      htmlEl.setAttribute('data-theme', 'light');
      themeToggleBtn.innerHTML = '<i class="ph ph-moon"></i>';
    }

    themeToggleBtn.addEventListener('click', () => {
      if (htmlEl.getAttribute('data-theme') === 'light') {
        htmlEl.removeAttribute('data-theme');
        localStorage.setItem('barber_theme', 'dark');
        themeToggleBtn.innerHTML = '<i class="ph ph-sun"></i>';
      } else {
        htmlEl.setAttribute('data-theme', 'light');
        localStorage.setItem('barber_theme', 'light');
        themeToggleBtn.innerHTML = '<i class="ph ph-moon"></i>';
      }
    });
  }
}

async function loadTenantAppearanceSettings() {
  try {
    if (!state.tenant?.id) return;

    const res = await fetch(`/api/auth/tenant`, { credentials: 'include' });
    let data = null;
    try {
      data = await res.json();
    } catch (_) {}

    if (!res.ok || !data) return;

    const settings = data.tenant || data;

    if (settings.name) {
      if (tenantNameTitle) tenantNameTitle.textContent = settings.name;
    }
    if (tenantNameInput && settings.name) tenantNameInput.value = settings.name;

    applyHudColors({
      primaryColor: settings.theme_color,
      borderColor: settings.border_color,
    });

    if (primaryColorInput) primaryColorInput.value = settings.theme_color === LEGACY_DEFAULT_PRIMARY_COLOR ? DEFAULT_PRIMARY_COLOR : (settings.theme_color || DEFAULT_PRIMARY_COLOR);
    if (borderColorInput) borderColorInput.value = settings.border_color || DEFAULT_BORDER_COLOR;
    if (recommendationBarbershopName && settings.name) recommendationBarbershopName.value = settings.name;
    if (recommendationClientName && state.user?.name) recommendationClientName.value = state.user.name;
    if (document.getElementById('bug-barbershop-name') && settings.name) document.getElementById('bug-barbershop-name').value = settings.name;
    if (document.getElementById('bug-client-name') && state.user?.name) document.getElementById('bug-client-name').value = state.user.name;
  } catch (error) {
    // silencioso - sem backend ainda
  }
}

function bindSettingsEvents() {
  // Se a página não tiver a seção de configurações, não faz nada.
  if (!settingsPanel || !settingsForm) return;

  settingsForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (settingsMessage) settingsMessage.textContent = 'Salvando...';

    const payload = {
      name: tenantNameInput?.value?.trim(),
      theme_color: primaryColorInput?.value,
      border_color: borderColorInput?.value,
    };

    applyHudColors({
      primaryColor: payload.theme_color,
      borderColor: payload.border_color,
    });

    if (payload.name && tenantNameTitle) tenantNameTitle.textContent = payload.name;

    try {
      const res2 = await fetch('/api/auth/tenant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (res2.ok) {
        if (settingsMessage) settingsMessage.textContent = 'Configurações salvas com sucesso.';
      } else {
        if (settingsMessage)
          settingsMessage.textContent = 'Não foi possível salvar no servidor (backend ainda pode não estar pronto).';
      }
    } catch (e) {
      if (settingsMessage) settingsMessage.textContent = 'Erro ao salvar (backend ainda pode não estar pronto).';
    }
  });
}

function bindRecommendationEvents() {
  if (!recommendationForm) return;

  recommendationForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (recommendationMessage) recommendationMessage.textContent = 'Enviando recomendação...';

    const payload = {
      client_name: recommendationClientName?.value?.trim(),
      barbershop_name: recommendationBarbershopName?.value?.trim(),
      recommendation: recommendationText?.value?.trim(),
    };

    if (!payload.client_name || !payload.barbershop_name || !payload.recommendation) {
      if (recommendationMessage) recommendationMessage.textContent = 'Preencha nome, barbearia e recomendação.';
      return;
    }

    try {
      const data = await apiFetch('/api/recommendations', 'POST', payload);
      if (data?.recommendation) {
        recommendationForm.reset();
        if (recommendationClientName && state.user?.name) recommendationClientName.value = state.user.name;
        if (recommendationBarbershopName && state.tenant?.name) recommendationBarbershopName.value = state.tenant.name;
        if (recommendationMessage) recommendationMessage.textContent = 'Recomendação enviada com sucesso. Obrigado!';
      }
    } catch (error) {
      if (recommendationMessage) recommendationMessage.textContent = error.message;
    }
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  bindEvents();
  bindSettingsEvents();
  bindRecommendationEvents();
  
  // Verifica se o usuário já tem uma sessão ativa (cookie)
  try {
    const data = await apiFetch('/api/auth/me');
    state.user = data.user;
    state.tenant = data.tenant;
    showApp();
    await loadAppData();
    await loadTenantAppearanceSettings();
  } catch (error) {
    // Se der erro (ex: não autenticado), exibe a tela de login
    showAuth();
  }
});
