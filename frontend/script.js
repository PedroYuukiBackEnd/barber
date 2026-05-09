const state = {
  user: null,
  tenant: null,
  clients: [],
  services: [],
  appointments: [],
  editing: { client: null, service: null, appointment: null },
};

// --- API Helpers ---
async function apiFetch(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {},
  };
  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  const response = await fetch(endpoint, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Erro na requisição ao servidor');
  }
  return data;
}

// --- DOM Elements ---
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const tenantNameTitle = document.getElementById('tenant-name');
const logoutButton = document.getElementById('logout-button');

const loginCard = document.getElementById('login-card');
const registerCard = document.getElementById('register-card');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');
const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');

const navButtons = document.querySelectorAll('.nav-button');
const sectionPanels = document.querySelectorAll('.panel');

const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const menuToggle = document.getElementById('menu-toggle');
const closeSidebar = document.getElementById('close-sidebar');

const clientsTable = document.getElementById('clients-table');
const servicesTable = document.getElementById('services-table');
const appointmentsTable = document.getElementById('appointments-table');
const appointmentClient = document.getElementById('appointment-client');
const appointmentServices = document.getElementById('appointment-services');
const appointmentTotal = document.getElementById('appointment-total');

const clientForm = document.getElementById('client-form');
const serviceForm = document.getElementById('service-form');
const appointmentForm = document.getElementById('appointment-form');

const newClientButton = document.getElementById('new-client');
const cancelClientButton = document.getElementById('cancel-client');
const newServiceButton = document.getElementById('new-service');
const cancelServiceButton = document.getElementById('cancel-service');
const newAppointmentButton = document.getElementById('new-appointment');
const cancelAppointmentButton = document.getElementById('cancel-appointment');

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
}

function showAuth() {
  authSection.classList.remove('hidden');
  appSection.classList.add('hidden');
}

function toggleAuthCard(isRegister) {
  if (isRegister) {
    loginCard.classList.add('hidden');
    registerCard.classList.remove('hidden');
  } else {
    registerCard.classList.add('hidden');
    loginCard.classList.remove('hidden');
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
  appointmentTotal.textContent = 'R$ 0,00';
}

function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
      <td>${client.name}</td>
      <td>${client.phone || '-'}</td>
      <td>${client.notes || '-'}</td>
      <td class="actions">
        <button class="button-secondary" data-action="edit-client" data-id="${client.id}">Editar</button>
        <button class="button-secondary" data-action="delete-client" data-id="${client.id}">Remover</button>
      </td>
    </tr>`).join('');
}

function renderServices() {
  servicesTable.innerHTML = state.services.map((service) => `
    <tr>
      <td>${service.name}</td>
      <td>${formatCurrency(service.price)}</td>
      <td>${service.description || '-'}</td>
      <td class="actions">
        <button class="button-secondary" data-action="edit-service" data-id="${service.id}">Editar</button>
        <button class="button-secondary" data-action="delete-service" data-id="${service.id}">Remover</button>
      </td>
    </tr>`).join('');
}

function renderAppointments() {
  appointmentsTable.innerHTML = state.appointments.map((appointment) => {
    const client = state.clients.find(c => c.id === appointment.client_id);
    const clientName = client ? client.name : 'Cliente não encontrado';
    const servicesText = appointment.services ? appointment.services.map(s => s.name).join(', ') : '-';
    
    return `
    <tr>
      <td>${clientName}</td>
      <td>${new Date(appointment.appointment_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
      <td>${servicesText}</td>
      <td>${formatCurrency(appointment.total_price || 0)}</td>
      <td class="actions">
        <button class="button-secondary" data-action="edit-appointment" data-id="${appointment.id}">Editar</button>
        <button class="button-secondary" data-action="delete-appointment" data-id="${appointment.id}">Remover</button>
      </td>
    </tr>`;
  }).join('');
}

function fillAppointmentServices() {
  appointmentServices.innerHTML = state.services.map((service) => `
    <label class="checkbox-item">
      <input type="checkbox" value="${service.id}" data-price="${service.price}" />
      <span>${service.name} - ${formatCurrency(service.price)}</span>
    </label>`).join('');
  appointmentServices.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', updateTotals);
  });
}

function fillClientSelect() {
  appointmentClient.innerHTML = state.clients.map((client) => `<option value="${client.id}">${client.name}</option>`).join('');
}

// --- Data Loading ---
async function loadAppData() {
  try {
    const [clientsRes, servicesRes, appointmentsRes] = await Promise.all([
      apiFetch('/api/clients'),
      apiFetch('/api/services'),
      apiFetch('/api/appointments')
    ]);
    
    state.clients = clientsRes.clients || [];
    state.services = servicesRes.services || [];
    state.appointments = appointmentsRes.appointments || [];

    renderClients();
    renderServices();
    renderAppointments();
    fillClientSelect();
    fillAppointmentServices();
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

async function handleRegister(event) {
  event.preventDefault();
  registerMessage.textContent = 'Criando conta...';
  try {
    const name = document.getElementById('register-name').value.trim();
    const tenantName = document.getElementById('register-tenant').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    
    const data = await apiFetch('/api/auth/register', 'POST', { email, password, name, tenantName });
    state.user = data.user;
    state.tenant = data.tenant;
    
    registerForm.reset();
    registerMessage.textContent = '';
    showApp();
    await loadAppData();
  } catch (error) {
    registerMessage.textContent = error.message;
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
  
  if (!client_id || !appointment_date || !service_ids.length) {
    alert('Por favor, preencha o cliente, a data e selecione pelo menos um serviço.');
    return;
  }

  const payload = { client_id, appointment_date, service_ids, notes };

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
    
    // Converter data para o formato do input datetime-local
    const dateObj = new Date(appointment.appointment_date);
    const localDateTime = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('appointment-date').value = localDateTime;
    
    document.getElementById('appointment-notes').value = appointment.notes || '';
    
    const apptServiceIds = appointment.services ? appointment.services.map(s => s.id) : [];
    appointmentServices.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = apptServiceIds.includes(Number(checkbox.value));
    });
    state.editing.appointment = appointment.id;
  } else {
    appointmentForm.reset();
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
  } catch (error) {
    alert(error.message);
  }
}

function bindEvents() {
  loginForm.addEventListener('submit', handleLogin);
  registerForm.addEventListener('submit', handleRegister);
  logoutButton.addEventListener('click', handleLogout);
  
  if (showRegisterBtn) showRegisterBtn.addEventListener('click', (e) => { e.preventDefault(); toggleAuthCard(true); });
  if (showLoginBtn) showLoginBtn.addEventListener('click', (e) => { e.preventDefault(); toggleAuthCard(false); });
  
  if (menuToggle) menuToggle.addEventListener('click', toggleSidebar);
  if (closeSidebar) closeSidebar.addEventListener('click', toggleSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', toggleSidebar);
  
  clientForm.addEventListener('submit', handleClientSubmit);
  serviceForm.addEventListener('submit', handleServiceSubmit);
  appointmentForm.addEventListener('submit', handleAppointmentSubmit);
  
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
  navButtons.forEach((button) => button.addEventListener('click', () => setSection(button.dataset.section)));
  
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

window.addEventListener('DOMContentLoaded', async () => {
  bindEvents();
  
  // Verifica se o usuário já tem uma sessão ativa (cookie)
  try {
    const data = await apiFetch('/api/auth/me');
    state.user = data.user;
    state.tenant = data.tenant;
    showApp();
    await loadAppData();
  } catch (error) {
    // Se der erro (ex: não autenticado), exibe a tela de login
    showAuth();
  }
});
