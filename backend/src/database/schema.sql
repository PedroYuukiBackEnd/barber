CREATE TABLE IF NOT EXISTS tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  theme_color TEXT NOT NULL DEFAULT '#d4d4d8',
  border_color TEXT NOT NULL DEFAULT '#3f3f46',
  logo_url TEXT DEFAULT '',
  require_pix_proof_to_finish INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  billing_type TEXT NOT NULL DEFAULT 'subscription',
  admin_notes TEXT DEFAULT '',
  billing_cycle_started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  billing_paid_at TEXT DEFAULT NULL,
  billing_proof_name TEXT DEFAULT '',
  billing_proof_data TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  appointment_date TEXT NOT NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_type TEXT DEFAULT 'dinheiro',
  payment_status TEXT DEFAULT 'a pagar',
  payment_proof_name TEXT DEFAULT '',
  payment_proof_data TEXT DEFAULT '',
  note_attachment_name TEXT DEFAULT '',
  note_attachment_data TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointment_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  service_name TEXT NOT NULL,
  service_price NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  barbershop_name TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  attachment_name TEXT DEFAULT '',
  attachment_data TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bug_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  barbershop_name TEXT NOT NULL,
  description TEXT NOT NULL,
  attachment_name TEXT DEFAULT '',
  attachment_data TEXT DEFAULT '',
  resolved_at TEXT DEFAULT NULL,
  resolution_message TEXT DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  appointment_id INTEGER,
  client_name TEXT NOT NULL,
  client_phone TEXT DEFAULT '',
  appointment_date TEXT NOT NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_type TEXT DEFAULT 'dinheiro',
  payment_status TEXT DEFAULT 'ja pago',
  payment_proof_name TEXT DEFAULT '',
  payment_proof_data TEXT DEFAULT '',
  note_attachment_name TEXT DEFAULT '',
  note_attachment_data TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  services TEXT NOT NULL DEFAULT '[]',
  completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
