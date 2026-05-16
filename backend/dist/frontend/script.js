const state = {
  user: null,
  tenant: null,
  clients: [],
  services: [],
  employees: [],
  products: [],
  productSales: [],
  appointments: [],
  serviceHistory: [],
  manualEarnings: [],
  bugReports: [],
  editing: { client: null, service: null, employee: null, product: null, appointment: null },
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
const appointmentEmployee = document.getElementById('appointment-employee');
const appointmentServices = document.getElementById('appointment-services');
const appointmentTotal = document.getElementById('appointment-total');
const appointmentFilterDate = document.getElementById('appointment-filter-date');
const appointmentFilterTime = document.getElementById('appointment-filter-time');
const appointmentFilterMinValue = document.getElementById('appointment-filter-min-value');
const appointmentFilterMaxValue = document.getElementById('appointment-filter-max-value');
const appointmentFilterService = document.getElementById('appointment-filter-service');
const appointmentFilterPaymentStatus = document.getElementById('appointment-filter-payment-status');
const clearAppointmentFiltersButton = document.getElementById('clear-appointment-filters');
const appointmentPaymentStatus = document.getElementById('appointment-payment-status');
const appointmentPaymentProofGroup = document.getElementById('appointment-payment-proof-group');
const appointmentPaymentProof = document.getElementById('appointment-payment-proof');
const appointmentPaymentProofCurrent = document.getElementById('appointment-payment-proof-current');
const appointmentNoteAttachment = document.getElementById('appointment-note-attachment');
const appointmentNoteAttachmentCurrent = document.getElementById('appointment-note-attachment-current');
const historyFilterClient = document.getElementById('history-filter-client');
const historyFilterDate = document.getElementById('history-filter-date');
const historyFilterTime = document.getElementById('history-filter-time');
const historyFilterMinValue = document.getElementById('history-filter-min-value');
const historyFilterMaxValue = document.getElementById('history-filter-max-value');
const historyFilterService = document.getElementById('history-filter-service');
const historyFilterPaymentType = document.getElementById('history-filter-payment-type');
const clearHistoryFiltersButton = document.getElementById('clear-history-filters');
const earningsPeriod = document.getElementById('earnings-period');
const earningsReferenceDate = document.getElementById('earnings-reference-date');
const earningsSourceFilter = document.getElementById('earnings-source-filter');
const earningsTotal = document.getElementById('earnings-total');
const earningsToday = document.getElementById('earnings-today');
const earningsWeek = document.getElementById('earnings-week');
const earningsMonth = document.getElementById('earnings-month');
const earningsYear = document.getElementById('earnings-year');
const earningsSourceTotal = document.getElementById('earnings-source-total');
const earningsPaymentTotal = document.getElementById('earnings-payment-total');
const earningsSourceChart = document.getElementById('earnings-source-chart');
const earningsPaymentChart = document.getElementById('earnings-payment-chart');
const earningsSourceLegend = document.getElementById('earnings-source-legend');
const earningsPaymentLegend = document.getElementById('earnings-payment-legend');
const earningsProductsTotal = document.getElementById('earnings-products-total');
const earningsEmployeesTotal = document.getElementById('earnings-employees-total');
const earningsProductsChart = document.getElementById('earnings-products-chart');
const earningsEmployeesChart = document.getElementById('earnings-employees-chart');
const earningsProductsLegend = document.getElementById('earnings-products-legend');
const earningsEmployeesLegend = document.getElementById('earnings-employees-legend');
const earningsTable = document.getElementById('earnings-table');
const manualEarningForm = document.getElementById('manual-earning-form');
const manualEarningAmount = document.getElementById('manual-earning-amount');
const manualEarningDate = document.getElementById('manual-earning-date');
const manualEarningDescription = document.getElementById('manual-earning-description');
const manualEarningMessage = document.getElementById('manual-earning-message');

const clientForm = document.getElementById('client-form');
const serviceForm = document.getElementById('service-form');
const employeeForm = document.getElementById('employee-form');
const appointmentForm = document.getElementById('appointment-form');
const bugForm = document.getElementById('bug-form');
const bugMessage = document.getElementById('bug-message');

const newClientButton = document.getElementById('new-client');
const cancelClientButton = document.getElementById('cancel-client');
const newServiceButton = document.getElementById('new-service');
const cancelServiceButton = document.getElementById('cancel-service');
const newEmployeeButton = document.getElementById('new-employee');
const cancelEmployeeButton = document.getElementById('cancel-employee');
const newAppointmentButton = document.getElementById('new-appointment');
const cancelAppointmentButton = document.getElementById('cancel-appointment');

// --- Settings ---
const settingsPanel = document.getElementById('settings-panel');
const settingsForm = document.getElementById('settings-form');
const settingsMessage = document.getElementById('settings-message');
const tenantNameInput = document.getElementById('tenant-name-input');
const primaryColorInput = document.getElementById('primary-color-input');
const borderColorInput = document.getElementById('border-color-input');
const requirePixProofInput = document.getElementById('require-pix-proof-input');
const recommendationForm = document.getElementById('recommendation-form');
const recommendationMessage = document.getElementById('recommendation-message');
const recommendationClientName = document.getElementById('recommendation-client-name');
const recommendationBarbershopName = document.getElementById('recommendation-barbershop-name');
const recommendationText = document.getElementById('recommendation-text');
const recommendationAttachment = document.getElementById('recommendation-attachment');
const bugAttachment = document.getElementById('bug-attachment');
const employeesTable = document.getElementById('employees-table');
const employeeNameInput = document.getElementById('employee-name');
const employeePhoneInput = document.getElementById('employee-phone');
const employeeGenderInput = document.getElementById('employee-gender');
const employeeSpecialtyInput = document.getElementById('employee-specialty');
const employeeMonthlyGoalInput = document.getElementById('employee-monthly-goal');
const employeeNotesInput = document.getElementById('employee-notes');
const productsTable = document.getElementById('products-table');
const productForm = document.getElementById('product-form');
const productSaleForm = document.getElementById('product-sale-form');
const newProductButton = document.getElementById('new-product');
const cancelProductButton = document.getElementById('cancel-product');
const productNameInput = document.getElementById('product-name');
const productQuantityInput = document.getElementById('product-quantity');
const productUnitInput = document.getElementById('product-unit');
const productSalePriceInput = document.getElementById('product-sale-price');
const productCostPriceInput = document.getElementById('product-cost-price');
const productNotesInput = document.getElementById('product-notes');
const saleProductInput = document.getElementById('sale-product');
const saleQuantityInput = document.getElementById('sale-quantity');
const saleDateInput = document.getElementById('sale-date');
const productSaleMessage = document.getElementById('product-sale-message');
const appointmentAlarm = document.getElementById('appointment-alarm');

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

function applyTenantSettings(settings) {
  if (!settings) return;
  state.tenant = { ...(state.tenant || {}), ...settings };
  if (tenantNameTitle && settings.name) tenantNameTitle.textContent = settings.name;
  if (tenantNameInput && settings.name) tenantNameInput.value = settings.name;
  if (requirePixProofInput) requirePixProofInput.checked = Boolean(settings.require_pix_proof_to_finish);
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

function resetEmployeeForm() {
  state.editing.employee = null;
  if (employeeForm) employeeForm.reset();
  if (employeeForm) employeeForm.classList.add('hidden');
  const employeeId = document.getElementById('employee-id');
  if (employeeId) employeeId.value = '';
}

function resetProductForm() {
  state.editing.product = null;
  if (productForm) productForm.reset();
  if (productForm) productForm.classList.add('hidden');
  const productId = document.getElementById('product-id');
  if (productId) productId.value = '';
  if (productUnitInput) productUnitInput.value = 'un.';
}

function resetAppointmentForm() {
  state.editing.appointment = null;
  appointmentForm.reset();
  appointmentForm.classList.add('hidden');
  document.getElementById('appointment-id').value = '';
  setDefaultAppointmentDateTime();
  if (appointmentEmployee) appointmentEmployee.value = '';
  if (appointmentAlarm) appointmentAlarm.checked = false;
  if (appointmentPaymentStatus) appointmentPaymentStatus.value = 'a pagar';
  syncPaymentProofVisibility();
  if (appointmentNoteAttachment) appointmentNoteAttachment.value = '';
  if (appointmentNoteAttachmentCurrent) appointmentNoteAttachmentCurrent.textContent = 'Imagem ou PDF de até 2 MB.';
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

function renderIconAction(action, id, icon, label, extraClass = '') {
  return `<button class="icon-button table-icon-action ${extraClass}" type="button" data-action="${action}" data-id="${id}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">
    <i class="ph ${icon}"></i>
  </button>`;
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

function getPaymentProof(item) {
  return {
    name: item?.payment_proof_name || '',
    data: item?.payment_proof_data || '',
  };
}

function getNoteAttachment(item) {
  return {
    name: item?.note_attachment_name || '',
    data: item?.note_attachment_data || '',
  };
}

function renderAttachmentLink(attachment, fallbackLabel = 'Abrir anexo') {
  if (!attachment?.data) return '-';
  const label = attachment.name || fallbackLabel;
  return `<a class="proof-link" href="${attachment.data}" target="_blank" rel="noopener" download="${escapeHtml(label)}">
    <i class="ph ph-paperclip"></i> ${escapeHtml(label)}
  </a>`;
}

function renderPaymentProofLink(item) {
  return renderAttachmentLink(getPaymentProof(item), 'Abrir comprovante');
}

function renderNoteAttachmentLink(item) {
  return renderAttachmentLink(getNoteAttachment(item), 'Abrir anexo');
}

function syncPaymentProofVisibility(currentAppointment = null) {
  if (!appointmentPaymentStatus || !appointmentPaymentProofGroup) return;
  const isPaid = appointmentPaymentStatus.value === 'ja pago';
  appointmentPaymentProofGroup.classList.toggle('hidden', !isPaid);

  if (!isPaid) {
    if (appointmentPaymentProof) appointmentPaymentProof.value = '';
    if (appointmentPaymentProofCurrent) appointmentPaymentProofCurrent.textContent = '';
    return;
  }

  const proof = getPaymentProof(currentAppointment);
  if (appointmentPaymentProofCurrent) {
    appointmentPaymentProofCurrent.textContent = proof.data
      ? `Comprovante atual: ${proof.name || 'arquivo anexado'}`
      : 'Envie uma imagem ou PDF de até 2 MB.';
  }
}

function readAttachmentFile(input) {
  if (!input?.files?.length) return Promise.resolve(null);
  const file = input.files[0];
  const maxBytes = 2 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return Promise.reject(new Error('Envie um arquivo em PNG, JPG, WEBP, GIF ou PDF.'));
  }
  if (file.size > maxBytes) {
    return Promise.reject(new Error('O arquivo deve ter até 2 MB.'));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      attachment_name: file.name,
      attachment_data: reader.result,
    });
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
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

function toDateKey(value) {
  if (!value) return '';
  const raw = String(value);
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateOnly(value) {
  const dateKey = toDateKey(value);
  if (!dateKey) return '-';
  const [year, month, day] = dateKey.split('-');
  return `${day}/${month}/${year}`;
}

function todayKey() {
  return toDateKey(new Date());
}

function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey || todayKey()).split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateToKey(date) {
  return toDateKey(date);
}

function getPeriodRange(period, referenceDateKey = todayKey()) {
  const reference = parseDateKey(referenceDateKey);
  let start = new Date(reference);
  let end = new Date(reference);

  if (period === 'week') {
    const day = reference.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start = addDays(reference, diff);
    end = addDays(start, 6);
  } else if (period === 'month') {
    start = new Date(reference.getFullYear(), reference.getMonth(), 1);
    end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  } else if (period === 'year') {
    start = new Date(reference.getFullYear(), 0, 1);
    end = new Date(reference.getFullYear(), 11, 31);
  }

  return { start: dateToKey(start), end: dateToKey(end) };
}

function isDateInRange(dateKey, range) {
  return dateKey >= range.start && dateKey <= range.end;
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

function hasClientAppointmentConflict(clientId, currentAppointmentId = null) {
  return state.appointments.some((appointment) => {
    if (currentAppointmentId && Number(appointment.id) === Number(currentAppointmentId)) return false;
    return Number(appointment.client_id) === Number(clientId);
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
          ${renderIconAction('edit-client', client.id, 'ph-pencil-simple', 'Editar cliente')}
          ${renderIconAction('delete-client', client.id, 'ph-trash', 'Remover cliente', 'danger-action')}
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
          ${renderIconAction('edit-service', service.id, 'ph-pencil-simple', 'Editar serviço')}
          ${renderIconAction('delete-service', service.id, 'ph-trash', 'Remover serviço', 'danger-action')}
        </div>
      </td>
    </tr>`).join('');
}

function getGenderLabel(gender) {
  const labels = { feminino: 'Feminino', masculino: 'Masculino' };
  return labels[gender] || '-';
}

function renderEmployees() {
  if (!employeesTable) return;
  if (!state.employees.length) {
    employeesTable.innerHTML = '<tr><td colspan="7">Nenhum funcionário cadastrado.</td></tr>';
    return;
  }

  employeesTable.innerHTML = state.employees.map((employee) => `
    <tr>
      <td>${escapeHtml(employee.name)}</td>
      <td>${escapeHtml(employee.phone || '-')}</td>
      <td>${getGenderLabel(employee.gender)}</td>
      <td>${escapeHtml(employee.specialty || '-')}</td>
      <td>${formatCurrency(employee.monthly_goal || 0)}</td>
      <td>${escapeHtml(employee.notes || '-')}</td>
      <td class="actions">
        <div class="action-buttons">
          ${renderIconAction('edit-employee', employee.id, 'ph-pencil-simple', 'Editar funcionário')}
          ${renderIconAction('delete-employee', employee.id, 'ph-trash', 'Remover funcionário', 'danger-action')}
        </div>
      </td>
    </tr>
  `).join('');
}

function renderProducts() {
  if (!productsTable) return;
  if (!state.products.length) {
    productsTable.innerHTML = '<tr><td colspan="6">Nenhum produto cadastrado.</td></tr>';
    return;
  }

  productsTable.innerHTML = state.products.map((product) => {
    const salePrice = Number(product.sale_price || 0);
    const costPrice = Number(product.cost_price || 0);
    return `
      <tr>
        <td>
          ${escapeHtml(product.name)}
          <div class="payment-proof-inline">${escapeHtml(product.notes || '')}</div>
        </td>
        <td>${Number(product.quantity || 0)} ${escapeHtml(product.unit_label || 'un.')}</td>
        <td>${formatCurrency(salePrice)}</td>
        <td>${formatCurrency(costPrice)}</td>
        <td>${formatCurrency(salePrice - costPrice)}</td>
        <td class="actions">
          <div class="action-buttons">
            ${renderIconAction('edit-product', product.id, 'ph-pencil-simple', 'Editar produto')}
            ${renderIconAction('delete-product', product.id, 'ph-trash', 'Remover produto', 'danger-action')}
          </div>
        </td>
      </tr>
    `;
  }).join('');
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
    const employeeName = appointment.employee_name || state.employees.find((employee) => Number(employee.id) === Number(appointment.employee_id))?.name || '-';
    const servicesText = appointment.services ? appointment.services.map(s => s.service_name || s.name).join(', ') : '-';
    const totalPrice = getAppointmentTotal(appointment);
    const paymentStatus = appointment.payment_status || 'a pagar';

    return `
    <tr>
      <td>${escapeHtml(clientName)}</td>
      <td>${formatDateTime(appointment.appointment_date)}</td>
      <td>
        ${escapeHtml(servicesText)}
        <div class="payment-proof-inline">Funcionário: ${escapeHtml(employeeName)}</div>
        <div class="payment-proof-inline">${renderNoteAttachmentLink(appointment)}</div>
      </td>
      <td>${formatCurrency(totalPrice)}</td>
      <td>
        ${getPaymentTypeLabel(appointment.payment_type || 'dinheiro')}
        <span class="payment-status">${getPaymentStatusLabel(paymentStatus)}</span>
        <div class="payment-proof-inline">${renderPaymentProofLink(appointment)}</div>
      </td>
      <td class="actions">
        <div class="action-buttons">
          ${renderIconAction('edit-appointment', appointment.id, 'ph-pencil-simple', 'Editar agendamento')}
          ${renderIconAction('finish-appointment', appointment.id, 'ph-check-circle', 'Finalizar trabalho')}
          ${renderIconAction('delete-appointment', appointment.id, 'ph-trash', 'Remover agendamento', 'danger-action')}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function renderServiceHistory() {
  if (!historyTable) return;
  const history = getFilteredServiceHistory();

  if (!history.length) {
    historyTable.innerHTML = '<tr><td colspan="7">Nenhum serviço finalizado encontrado.</td></tr>';
    return;
  }

  historyTable.innerHTML = history.map((item) => {
    const services = getHistoryServices(item);
    const servicesText = services.length ? services.map((service) => service.service_name || service.name).join(', ') : '-';
    const totalPrice = getAppointmentTotal(item);
    const employeeName = item.employee_name || '-';

    return `
    <tr>
      <td>${escapeHtml(item.client_name)}</td>
      <td>${formatDateTime(item.appointment_date)}</td>
      <td>
        ${escapeHtml(servicesText)}
        <div class="payment-proof-inline">Funcionário: ${escapeHtml(employeeName)}</div>
        <div class="payment-proof-inline">${renderNoteAttachmentLink(item)}</div>
      </td>
      <td>${formatCurrency(totalPrice)}</td>
      <td>${getPaymentTypeLabel(item.payment_type || 'dinheiro')}</td>
      <td>${renderPaymentProofLink(item)}</td>
      <td>${formatDateTime(item.completed_at)}</td>
    </tr>`;
  }).join('');
}

function getEarningEntries() {
  const serviceEntries = state.serviceHistory.map((item) => {
    const services = getHistoryServices(item);
    const serviceNames = services.map((service) => service.service_name || service.name).filter(Boolean).join(', ');
    return {
      id: `appointment-${item.id}`,
      rawId: item.id,
      source: 'appointment',
      sourceLabel: 'Agendamento',
      date: toDateKey(item.appointment_date || item.completed_at),
      amount: getAppointmentTotal(item),
      description: item.client_name ? `${item.client_name}${serviceNames ? ` - ${serviceNames}` : ''}${item.employee_name ? ` (${item.employee_name})` : ''}` : (serviceNames || 'Serviço finalizado'),
      paymentType: item.payment_type || 'dinheiro',
      removable: true,
      deleteAction: 'delete-history-earning',
    };
  });

  const manualEntries = state.manualEarnings.map((item) => ({
    id: `manual-${item.id}`,
    rawId: item.id,
    source: 'manual',
    sourceLabel: 'Manual',
    date: toDateKey(item.entry_date || item.created_at),
    amount: Number(item.amount || 0),
    description: item.description || 'Ganho manual',
    paymentType: 'manual',
    removable: true,
    deleteAction: 'delete-manual-earning',
  }));

  const productEntries = state.productSales.map((item) => ({
    id: `product-${item.id}`,
    rawId: item.id,
    source: 'product',
    sourceLabel: 'Item vendido',
    date: toDateKey(item.sold_at || item.created_at),
    amount: Number(item.profit_total ?? (Number(item.gross_total || 0) - Number(item.cost_total || 0))),
    grossAmount: Number(item.gross_total || 0),
    costAmount: Number(item.cost_total || 0),
    productName: item.product_name || 'Produto',
    description: `${item.product_name || 'Produto'} - ${Number(item.quantity || 0)} ${item.unit_label || 'un.'} (venda ${formatCurrency(item.gross_total || 0)} / custo ${formatCurrency(item.cost_total || 0)})`,
    paymentType: 'product',
    removable: true,
    deleteAction: 'delete-product-sale',
  }));

  return [...serviceEntries, ...manualEntries, ...productEntries]
    .filter((entry) => entry.date && Number.isFinite(entry.amount))
    .sort((a, b) => b.date.localeCompare(a.date));
}

function sumEarnings(entries) {
  return entries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
}

function getFilteredEarnings() {
  const period = earningsPeriod?.value || 'month';
  const reference = earningsReferenceDate?.value || todayKey();
  const source = earningsSourceFilter?.value || '';
  const range = getPeriodRange(period, reference);

  return getEarningEntries().filter((entry) => {
    return isDateInRange(entry.date, range) && (!source || entry.source === source);
  });
}

function groupEarnings(entries, keyGetter) {
  return entries.reduce((groups, entry) => {
    const key = keyGetter(entry);
    groups[key] = (groups[key] || 0) + Number(entry.amount || 0);
    return groups;
  }, {});
}

function renderPieChart(chartEl, legendEl, groups, labels, colors) {
  if (!chartEl || !legendEl) return;
  const total = Object.values(groups).reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    chartEl.style.background = 'var(--surface-color)';
    chartEl.innerHTML = '<span>Sem dados</span>';
    legendEl.innerHTML = '';
    return;
  }

  let offset = 0;
  const segments = Object.entries(groups).map(([key, value], index) => {
    const start = offset;
    const size = (value / total) * 100;
    offset += size;
    return `${colors[index % colors.length]} ${start}% ${offset}%`;
  });

  chartEl.style.background = `conic-gradient(${segments.join(', ')})`;
  chartEl.innerHTML = `<strong>${formatCurrency(total)}</strong>`;
  legendEl.innerHTML = Object.entries(groups).map(([key, value], index) => `
    <div class="legend-item">
      <span class="legend-color" style="background:${colors[index % colors.length]}"></span>
      <span>${escapeHtml(labels[key] || key)}</span>
      <strong>${formatCurrency(value)}</strong>
    </div>
  `).join('');
}

function buildEmployeeGoalLabels(employeeGroups) {
  return Object.fromEntries(Object.entries(employeeGroups).map(([name, value]) => {
    const employee = state.employees.find((item) => item.name === name);
    const goal = Number(employee?.monthly_goal || 0);
    if (!goal) return [name, name];
    const percent = Math.min(999, Math.round((Number(value || 0) / goal) * 100));
    return [name, `${name} (${percent}% da meta)`];
  }));
}

function renderEarnings() {
  if (!earningsTable) return;
  const reference = earningsReferenceDate?.value || todayKey();
  const allEntries = getEarningEntries();
  const filteredEntries = getFilteredEarnings();
  const todayRange = getPeriodRange('day', todayKey());
  const weekRange = getPeriodRange('week', reference);
  const monthRange = getPeriodRange('month', reference);
  const yearRange = getPeriodRange('year', reference);

  if (earningsTotal) earningsTotal.textContent = formatCurrency(sumEarnings(filteredEntries));
  if (earningsToday) earningsToday.textContent = formatCurrency(sumEarnings(allEntries.filter((entry) => isDateInRange(entry.date, todayRange))));
  if (earningsWeek) earningsWeek.textContent = formatCurrency(sumEarnings(allEntries.filter((entry) => isDateInRange(entry.date, weekRange))));
  if (earningsMonth) earningsMonth.textContent = formatCurrency(sumEarnings(allEntries.filter((entry) => isDateInRange(entry.date, monthRange))));
  if (earningsYear) earningsYear.textContent = formatCurrency(sumEarnings(allEntries.filter((entry) => isDateInRange(entry.date, yearRange))));

  const sourceGroups = groupEarnings(filteredEntries, (entry) => entry.source);
  const paymentGroups = groupEarnings(filteredEntries, (entry) => entry.paymentType);
  const productGroups = groupEarnings(filteredEntries.filter((entry) => entry.source === 'product'), (entry) => entry.productName || 'Produto');
  const employeeEntries = filteredEntries.filter((entry) => entry.source === 'appointment');
  const employeeGroups = groupEarnings(employeeEntries, (entry) => {
    const match = String(entry.description || '').match(/\(([^)]+)\)$/);
    return match?.[1] || 'Sem funcionário';
  });
  if (earningsSourceTotal) earningsSourceTotal.textContent = `${filteredEntries.length} lançamento${filteredEntries.length === 1 ? '' : 's'}`;
  if (earningsPaymentTotal) earningsPaymentTotal.textContent = `${filteredEntries.length} lançamento${filteredEntries.length === 1 ? '' : 's'}`;
  if (earningsProductsTotal) earningsProductsTotal.textContent = `${Object.keys(productGroups).length} produto${Object.keys(productGroups).length === 1 ? '' : 's'}`;
  if (earningsEmployeesTotal) earningsEmployeesTotal.textContent = `${Object.keys(employeeGroups).length} profissional${Object.keys(employeeGroups).length === 1 ? '' : 'is'}`;
  renderPieChart(earningsSourceChart, earningsSourceLegend, sourceGroups, {
    appointment: 'Agendamentos',
    manual: 'Ganhos manuais',
    product: 'Itens vendidos',
  }, ['#d4d4d8', '#38bdf8', '#22c55e']);
  renderPieChart(earningsPaymentChart, earningsPaymentLegend, paymentGroups, {
    dinheiro: 'Dinheiro',
    pix: 'PIX',
    debito: 'Débito',
    credito: 'Crédito',
    manual: 'Manual',
    product: 'Produto',
  }, ['#22c55e', '#38bdf8', '#f59e0b', '#a78bfa', '#d4d4d8']);
  renderPieChart(earningsProductsChart, earningsProductsLegend, productGroups, {}, ['#22c55e', '#84cc16', '#14b8a6', '#f59e0b', '#ef4444']);
  renderPieChart(earningsEmployeesChart, earningsEmployeesLegend, employeeGroups, buildEmployeeGoalLabels(employeeGroups), ['#38bdf8', '#a78bfa', '#f97316', '#22c55e', '#d4d4d8']);

  if (!filteredEntries.length) {
    earningsTable.innerHTML = '<tr><td colspan="6">Nenhum ganho encontrado neste período.</td></tr>';
    return;
  }

  earningsTable.innerHTML = filteredEntries.map((entry) => `
    <tr>
      <td>${formatDateOnly(entry.date)}</td>
      <td>${escapeHtml(entry.sourceLabel)}</td>
      <td>${escapeHtml(entry.description)}</td>
      <td>${entry.paymentType === 'manual' ? '-' : getPaymentTypeLabel(entry.paymentType)}</td>
      <td>${formatCurrency(entry.amount)}</td>
      <td class="actions">
        ${entry.removable ? renderIconAction(entry.deleteAction, entry.rawId, 'ph-trash', 'Remover lançamento', 'danger-action') : '-'}
      </td>
    </tr>
  `).join('');
}

function renderBugReports() {
  if (!bugReportsTable) return;
  if (!state.bugReports.length) {
    bugReportsTable.innerHTML = '<tr><td colspan="3">Nenhum relato enviado ainda.</td></tr>';
    return;
  }

  bugReportsTable.innerHTML = state.bugReports.map((report) => `
    <tr>
      <td>
        ${escapeHtml(report.description)}
        <div class="payment-proof-inline">${renderAttachmentLink({ name: report.attachment_name, data: report.attachment_data })}</div>
      </td>
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

function fillEmployeeSelect() {
  if (!appointmentEmployee) return;
  const selectedValue = appointmentEmployee.value;
  appointmentEmployee.innerHTML = '<option value="">Sem funcionário definido</option>' + state.employees.map((employee) => (
    `<option value="${employee.id}">${escapeHtml(employee.name)}${employee.specialty ? ` - ${escapeHtml(employee.specialty)}` : ''}</option>`
  )).join('');
  appointmentEmployee.value = selectedValue;
}

function fillProductSelect() {
  if (!saleProductInput) return;
  if (!state.products.length) {
    saleProductInput.innerHTML = '<option value="">Cadastre um produto primeiro</option>';
    return;
  }
  saleProductInput.innerHTML = state.products.map((product) => (
    `<option value="${product.id}">${escapeHtml(product.name)} - ${Number(product.quantity || 0)} ${escapeHtml(product.unit_label || 'un.')} em estoque</option>`
  )).join('');
}

// --- Data Loading ---
async function loadAppData() {
  try {
    const [clientsRes, servicesRes, employeesRes, productsRes, productSalesRes, appointmentsRes, historyRes, earningsRes, bugReportsRes] = await Promise.all([
      apiFetch('/api/clients'),
      apiFetch('/api/services'),
      apiFetch('/api/employees'),
      apiFetch('/api/inventory/products'),
      apiFetch('/api/inventory/sales'),
      apiFetch('/api/appointments'),
      apiFetch('/api/appointments/history'),
      apiFetch('/api/earnings'),
      apiFetch('/api/bug-reports')
    ]);
    
    state.clients = clientsRes.clients || [];
    state.services = servicesRes.services || [];
    state.employees = employeesRes.employees || [];
    state.products = productsRes.products || [];
    state.productSales = productSalesRes.sales || [];
    state.appointments = appointmentsRes.appointments || [];
    state.serviceHistory = historyRes.history || [];
    state.manualEarnings = earningsRes.earnings || [];
    state.bugReports = bugReportsRes.reports || [];

    renderClients();
    renderServices();
    renderEmployees();
    renderProducts();
    renderAppointments();
    renderServiceHistory();
    renderEarnings();
    renderBugReports();
    fillClientSelect();
    fillEmployeeSelect();
    fillProductSelect();
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
    if (data.user?.role !== 'user') {
      window.location.href = 'admin.html';
      return;
    }
    state.user = data.user;
    state.tenant = data.tenant;
    applyTenantSettings(data.tenant);
    
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

async function handleEmployeeSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('employee-id').value;
  const payload = {
    name: employeeNameInput?.value?.trim(),
    phone: employeePhoneInput?.value?.trim() || '',
    gender: employeeGenderInput?.value || '',
    specialty: employeeSpecialtyInput?.value?.trim() || '',
    monthly_goal: Number(employeeMonthlyGoalInput?.value || 0),
    notes: employeeNotesInput?.value?.trim() || '',
  };
  if (!payload.name) return;

  try {
    if (id) {
      await apiFetch(`/api/employees/${id}`, 'PUT', payload);
    } else {
      await apiFetch('/api/employees', 'POST', payload);
    }
    await loadAppData();
    resetEmployeeForm();
  } catch (error) {
    alert(error.message);
  }
}

async function handleProductSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('product-id')?.value || '';
  const payload = {
    name: productNameInput?.value?.trim(),
    quantity: Number(productQuantityInput?.value || 0),
    unit_label: productUnitInput?.value?.trim() || 'un.',
    sale_price: Number(productSalePriceInput?.value || 0),
    cost_price: Number(productCostPriceInput?.value || 0),
    notes: productNotesInput?.value?.trim() || '',
  };
  if (!payload.name) return;

  try {
    if (id) {
      await apiFetch(`/api/inventory/products/${id}`, 'PUT', payload);
    } else {
      await apiFetch('/api/inventory/products', 'POST', payload);
    }
    await loadAppData();
    resetProductForm();
  } catch (error) {
    alert(error.message);
  }
}

async function handleProductSaleSubmit(event) {
  event.preventDefault();
  if (productSaleMessage) productSaleMessage.textContent = 'Registrando venda...';
  const productId = Number(saleProductInput?.value || 0);
  const quantity = Number(saleQuantityInput?.value || 0);
  if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
    if (productSaleMessage) productSaleMessage.textContent = 'Selecione o produto e informe uma quantidade válida.';
    return;
  }

  try {
    await apiFetch(`/api/inventory/products/${productId}/sell`, 'POST', {
      quantity,
      sold_at: saleDateInput?.value || todayKey(),
    });
    if (productSaleForm) productSaleForm.reset();
    if (saleDateInput) saleDateInput.value = todayKey();
    if (productSaleMessage) productSaleMessage.textContent = 'Venda registrada e estoque atualizado.';
    await loadAppData();
  } catch (error) {
    if (productSaleMessage) productSaleMessage.textContent = error.message;
  }
}

function scheduleAppointmentAlarm(appointment, clientName) {
  if (!appointment?.alarm_enabled) return;
  const when = new Date(normalizeAppointmentDate(appointment.appointment_date)).getTime();
  if (!Number.isFinite(when) || when <= Date.now()) return;
  const title = 'Agendamento';
  const message = `${clientName || 'Cliente'} às ${formatDateTime(appointment.appointment_date)}`;

  if (window.SistemaBarberAndroid?.scheduleAlarm) {
    const result = window.SistemaBarberAndroid.scheduleAlarm(String(appointment.id), title, message, String(when));
    if (result === false) alert('Para usar alarmes no celular, permita notificações do Sistema Barber.');
    return;
  }

  if (!('Notification' in window)) {
    alert('Alarmes locais não são compatíveis neste navegador.');
    return;
  }

  Notification.requestPermission().then((permission) => {
    if (permission !== 'granted') {
      alert('Permissão de notificação negada. O alarme não foi ativado.');
      return;
    }
    window.setTimeout(() => new Notification(title, { body: message }), Math.max(0, when - Date.now()));
  });
}

function readCheckedServiceIds() {
  return Array.from(appointmentServices.querySelectorAll('input[type="checkbox"]:checked')).map((checkbox) => Number(checkbox.value));
}

async function handleAppointmentSubmit(event) {
  event.preventDefault();
  const id = document.getElementById('appointment-id').value;
  const client_id = Number(appointmentClient.value);
  const employee_id = appointmentEmployee?.value ? Number(appointmentEmployee.value) : null;
  const appointment_date = document.getElementById('appointment-date').value;
  const notes = document.getElementById('appointment-notes').value.trim();
  const service_ids = readCheckedServiceIds();
  const payment_type = document.getElementById('appointment-payment-type').value;
  const payment_status = appointmentPaymentStatus?.value || 'a pagar';
  const alarm_enabled = Boolean(appointmentAlarm?.checked);
  
  if (!client_id || !appointment_date || !service_ids.length) {
    alert('Por favor, preencha o cliente, a data e selecione pelo menos um serviço.');
    return;
  }

  if (hasAppointmentScheduleConflict(appointment_date, id)) {
    const shouldContinue = confirm('Já existe um agendamento neste mesmo dia e horário. Deseja mesmo agendar no mesmo dia/horário?');
    if (!shouldContinue) return;
  }

  if (hasClientAppointmentConflict(client_id, id)) {
    const shouldContinue = confirm('Esse cliente já possui um agendamento em aberto. Deseja agendar outra vez?');
    if (!shouldContinue) return;
  }

  try {
    const currentAppointment = id ? state.appointments.find((item) => Number(item.id) === Number(id)) : null;
    const uploadedProof = payment_status === 'ja pago' ? await readAttachmentFile(appointmentPaymentProof) : null;
    const existingProof = payment_status === 'ja pago' ? getPaymentProof(currentAppointment) : { name: '', data: '' };
    const uploadedNoteAttachment = await readAttachmentFile(appointmentNoteAttachment);
    const existingNoteAttachment = getNoteAttachment(currentAppointment);
    const payload = {
      client_id,
      employee_id,
      appointment_date,
      service_ids,
      payment_type,
      payment_status,
      payment_proof_name: uploadedProof?.attachment_name || existingProof.name || '',
      payment_proof_data: uploadedProof?.attachment_data || existingProof.data || '',
      note_attachment_name: uploadedNoteAttachment?.attachment_name || existingNoteAttachment.name || '',
      note_attachment_data: uploadedNoteAttachment?.attachment_data || existingNoteAttachment.data || '',
      alarm_enabled,
      notes,
    };

    let data;
    if (id) {
      data = await apiFetch(`/api/appointments/${id}`, 'PUT', payload);
    } else {
      data = await apiFetch('/api/appointments', 'POST', payload);
    }
    const clientName = state.clients.find((client) => Number(client.id) === Number(client_id))?.name || '';
    scheduleAppointmentAlarm({ ...(data?.appointment || {}), client_id, appointment_date, alarm_enabled }, clientName);
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
    const uploadedAttachment = await readAttachmentFile(bugAttachment);
    const data = await apiFetch('/api/bug-reports', 'POST', {
      client_name: clientName,
      barbershop_name: barbershopName,
      description,
      attachment_name: uploadedAttachment?.attachment_name || '',
      attachment_data: uploadedAttachment?.attachment_data || '',
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

async function handleManualEarningSubmit(event) {
  event.preventDefault();
  if (manualEarningMessage) manualEarningMessage.textContent = 'Adicionando ganho...';

  const amount = Number(manualEarningAmount?.value || 0);
  const entryDate = manualEarningDate?.value || todayKey();
  const description = manualEarningDescription?.value?.trim() || '';

  if (!Number.isFinite(amount) || amount <= 0) {
    if (manualEarningMessage) manualEarningMessage.textContent = 'Informe um valor maior que zero.';
    return;
  }

  try {
    const data = await apiFetch('/api/earnings', 'POST', {
      amount,
      entry_date: entryDate,
      description,
    });
    state.manualEarnings.unshift(data.earning);
    manualEarningForm.reset();
    if (manualEarningDate) manualEarningDate.value = todayKey();
    if (manualEarningMessage) manualEarningMessage.textContent = 'Ganho adicionado com sucesso.';
    renderEarnings();
  } catch (error) {
    if (manualEarningMessage) manualEarningMessage.textContent = error.message;
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

function openEmployeeForm(employee = null) {
  if (!employeeForm) return;
  if (employee) {
    document.getElementById('employee-id').value = employee.id;
    if (employeeNameInput) employeeNameInput.value = employee.name || '';
    if (employeePhoneInput) employeePhoneInput.value = employee.phone || '';
    if (employeeGenderInput) employeeGenderInput.value = employee.gender || '';
    if (employeeSpecialtyInput) employeeSpecialtyInput.value = employee.specialty || '';
    if (employeeMonthlyGoalInput) employeeMonthlyGoalInput.value = employee.monthly_goal || '';
    if (employeeNotesInput) employeeNotesInput.value = employee.notes || '';
    state.editing.employee = employee.id;
  } else {
    employeeForm.reset();
    state.editing.employee = null;
  }
  employeeForm.classList.remove('hidden');
}

function openProductForm(product = null) {
  if (!productForm) return;
  if (product) {
    document.getElementById('product-id').value = product.id;
    if (productNameInput) productNameInput.value = product.name || '';
    if (productQuantityInput) productQuantityInput.value = product.quantity || 0;
    if (productUnitInput) productUnitInput.value = product.unit_label || 'un.';
    if (productSalePriceInput) productSalePriceInput.value = product.sale_price || 0;
    if (productCostPriceInput) productCostPriceInput.value = product.cost_price || 0;
    if (productNotesInput) productNotesInput.value = product.notes || '';
    state.editing.product = product.id;
  } else {
    productForm.reset();
    if (productUnitInput) productUnitInput.value = 'un.';
    state.editing.product = null;
  }
  productForm.classList.remove('hidden');
}

function openAppointmentForm(appointment = null) {
  if (appointment) {
    document.getElementById('appointment-id').value = appointment.id;
    appointmentClient.value = appointment.client_id;
    if (appointmentEmployee) appointmentEmployee.value = appointment.employee_id || '';
    if (appointmentAlarm) appointmentAlarm.checked = Boolean(Number(appointment.alarm_enabled || 0));
    
    document.getElementById('appointment-date').value = normalizeAppointmentDate(appointment.appointment_date);
    
    document.getElementById('appointment-notes').value = appointment.notes || '';
    if (appointmentNoteAttachmentCurrent) {
      const noteAttachment = getNoteAttachment(appointment);
      appointmentNoteAttachmentCurrent.textContent = noteAttachment.data
        ? `Anexo atual: ${noteAttachment.name || 'arquivo anexado'}`
        : 'Imagem ou PDF de até 2 MB.';
    }
    document.getElementById('appointment-payment-type').value = appointment.payment_type || 'dinheiro';
    if (appointmentPaymentStatus) appointmentPaymentStatus.value = appointment.payment_status || 'a pagar';
    
    const apptServiceIds = appointment.services ? appointment.services.map(s => s.service_id || s.id) : [];
    appointmentServices.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = apptServiceIds.includes(Number(checkbox.value));
    });
    state.editing.appointment = appointment.id;
  } else {
    appointmentForm.reset();
    setDefaultAppointmentDateTime();
    if (appointmentEmployee) appointmentEmployee.value = '';
    if (appointmentAlarm) appointmentAlarm.checked = false;
    if (appointmentPaymentStatus) appointmentPaymentStatus.value = 'a pagar';
    state.editing.appointment = null;
  }
  if (appointmentPaymentProof) appointmentPaymentProof.value = '';
  if (appointmentNoteAttachment) appointmentNoteAttachment.value = '';
  if (!appointment && appointmentNoteAttachmentCurrent) appointmentNoteAttachmentCurrent.textContent = 'Imagem ou PDF de até 2 MB.';
  syncPaymentProofVisibility(appointment);
  updateTotals();
  appointmentForm.classList.remove('hidden');
}

// --- Table Actions ---
async function handleTableClick(event) {
  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;
  const action = actionButton.dataset.action;
  const id = actionButton.dataset.id;
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

    if (action === 'edit-employee') {
      const employee = state.employees.find((item) => Number(item.id) === Number(id));
      if (employee) openEmployeeForm(employee);
    }
    if (action === 'delete-employee') {
      if (confirm('Remover este funcionário? Agendamentos antigos manterão o histórico do nome.')) {
        await apiFetch(`/api/employees/${id}`, 'DELETE');
        await loadAppData();
      }
    }

    if (action === 'edit-product') {
      const product = state.products.find((item) => Number(item.id) === Number(id));
      if (product) openProductForm(product);
    }
    if (action === 'delete-product') {
      if (confirm('Tem certeza que deseja remover este produto?')) {
        await apiFetch(`/api/inventory/products/${id}`, 'DELETE');
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
        const appointment = state.appointments.find((item) => Number(item.id) === Number(id));
        if (state.tenant?.require_pix_proof_to_finish && appointment?.payment_type === 'pix' && (appointment.payment_status !== 'ja pago' || !appointment.payment_proof_data)) {
          alert('Para finalizar trabalho pago via PIX, marque como já pago e anexe o comprovante no agendamento.');
          return;
        }
        await apiFetch(`/api/appointments/${id}/finish`, 'POST');
        state.appointments = state.appointments.filter((appointment) => Number(appointment.id) !== Number(id));
        renderAppointments();
        await loadAppData();
      }
    }
  } catch (error) {
    alert(error.message);
  }
}

async function handleEarningsTableClick(event) {
  const button = event.target.closest('[data-action="delete-manual-earning"], [data-action="delete-history-earning"], [data-action="delete-product-sale"]');
  if (!button) return;
  const id = button.dataset.id;
  const isHistory = button.dataset.action === 'delete-history-earning';
  const isProductSale = button.dataset.action === 'delete-product-sale';
  if (!confirm(isHistory ? 'Remover este ganho do histórico? Isso excluirá o registro finalizado dessa conta.' : (isProductSale ? 'Remover esta venda e devolver o item ao estoque?' : 'Remover este ganho manual?'))) return;

  try {
    if (isHistory) {
      await apiFetch(`/api/appointments/history/${id}`, 'DELETE');
      state.serviceHistory = state.serviceHistory.filter((item) => Number(item.id) !== Number(id));
    } else if (isProductSale) {
      await apiFetch(`/api/inventory/sales/${id}`, 'DELETE');
      state.productSales = state.productSales.filter((item) => Number(item.id) !== Number(id));
      await loadAppData();
    } else {
      await apiFetch(`/api/earnings/${id}`, 'DELETE');
      state.manualEarnings = state.manualEarnings.filter((item) => Number(item.id) !== Number(id));
    }
    renderEarnings();
    renderServiceHistory();
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
  if (employeeForm) employeeForm.addEventListener('submit', handleEmployeeSubmit);
  if (productForm) productForm.addEventListener('submit', handleProductSubmit);
  if (productSaleForm) productSaleForm.addEventListener('submit', handleProductSaleSubmit);
  appointmentForm.addEventListener('submit', handleAppointmentSubmit);
  if (bugForm) bugForm.addEventListener('submit', handleBugSubmit);
  if (manualEarningForm) manualEarningForm.addEventListener('submit', handleManualEarningSubmit);
  
  newClientButton.addEventListener('click', () => openClientForm());
  cancelClientButton.addEventListener('click', resetClientForm);
  
  newServiceButton.addEventListener('click', () => openServiceForm());
  cancelServiceButton.addEventListener('click', resetServiceForm);
  if (newEmployeeButton) newEmployeeButton.addEventListener('click', () => openEmployeeForm());
  if (cancelEmployeeButton) cancelEmployeeButton.addEventListener('click', resetEmployeeForm);
  if (newProductButton) newProductButton.addEventListener('click', () => openProductForm());
  if (cancelProductButton) cancelProductButton.addEventListener('click', resetProductForm);
  
  newAppointmentButton.addEventListener('click', () => openAppointmentForm());
  cancelAppointmentButton.addEventListener('click', resetAppointmentForm);
  if (appointmentPaymentStatus) {
    appointmentPaymentStatus.addEventListener('change', () => {
      const currentAppointment = state.editing.appointment
        ? state.appointments.find((item) => Number(item.id) === Number(state.editing.appointment))
        : null;
      syncPaymentProofVisibility(currentAppointment);
    });
  }
  
  clientsTable.addEventListener('click', handleTableClick);
  servicesTable.addEventListener('click', handleTableClick);
  if (employeesTable) employeesTable.addEventListener('click', handleTableClick);
  if (productsTable) productsTable.addEventListener('click', handleTableClick);
  appointmentsTable.addEventListener('click', handleTableClick);
  if (earningsTable) earningsTable.addEventListener('click', handleEarningsTableClick);
  
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
  [earningsPeriod, earningsReferenceDate, earningsSourceFilter]
    .filter(Boolean)
    .forEach((filter) => filter.addEventListener('input', renderEarnings));
  document.addEventListener('click', (event) => {
    const button = event.target.closest('.nav-button[data-section]');
    if (button) setSection(button.dataset.section);
  });
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

    applyTenantSettings(settings);

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
      require_pix_proof_to_finish: Boolean(requirePixProofInput?.checked),
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
        const data = await res2.json().catch(() => null);
        if (data?.tenant) applyTenantSettings(data.tenant);
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
      const uploadedAttachment = await readAttachmentFile(recommendationAttachment);
      const data = await apiFetch('/api/recommendations', 'POST', {
        ...payload,
        attachment_name: uploadedAttachment?.attachment_name || '',
        attachment_data: uploadedAttachment?.attachment_data || '',
      });
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
  if (earningsReferenceDate && !earningsReferenceDate.value) earningsReferenceDate.value = todayKey();
  if (manualEarningDate && !manualEarningDate.value) manualEarningDate.value = todayKey();
  if (saleDateInput && !saleDateInput.value) saleDateInput.value = todayKey();
  bindEvents();
  bindSettingsEvents();
  bindRecommendationEvents();
  
  // Verifica se o usuário já tem uma sessão ativa (cookie)
  try {
    const data = await apiFetch('/api/auth/me');
    if (data.user?.role !== 'user') {
      window.location.href = 'admin.html';
      return;
    }
    state.user = data.user;
    state.tenant = data.tenant;
    applyTenantSettings(data.tenant);
    showApp();
    await loadAppData();
    await loadTenantAppearanceSettings();
  } catch (error) {
    // Se der erro (ex: não autenticado), exibe a tela de login
    showAuth();
  }
});
