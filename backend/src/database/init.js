const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const bcrypt = require('bcrypt');
const db = require('../config/db');

const schemaPath = path.join(__dirname, 'schema.sql');

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function seedDefaultSuperadmin() {
  const superadminCount = await get("SELECT COUNT(*) AS count FROM users WHERE role = 'superadmin'");
  if (Number(superadminCount.count) > 0) return;

  const adminName = process.env.DEFAULT_SUPERADMIN_NAME || 'Dono da Plataforma';
  const adminEmail = process.env.DEFAULT_SUPERADMIN_EMAIL;
  const adminPassword = process.env.DEFAULT_SUPERADMIN_PASSWORD;
  const tenantName = process.env.DEFAULT_PLATFORM_TENANT_NAME || 'Plataforma';

  if (!adminEmail || !adminPassword) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Configure DEFAULT_SUPERADMIN_EMAIL e DEFAULT_SUPERADMIN_PASSWORD no primeiro deploy.');
    }
    console.warn('DEFAULT_SUPERADMIN_EMAIL nao definido. Pulando superadmin padrao no ambiente local.');
    return;
  }

  const existingUser = await get('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (existingUser) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await run('UPDATE users SET name = ?, password_hash = ?, role = ? WHERE id = ?', [
      adminName,
      passwordHash,
      'superadmin',
      existingUser.id,
    ]);
    console.log('Usuario existente promovido para superadmin.');
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const tenant = await run('INSERT INTO tenants (name) VALUES (?) RETURNING id', [tenantName]);
  await run(
    'INSERT INTO users (tenant_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [tenant.lastID, adminName, adminEmail, passwordHash, 'superadmin']
  );

  console.log('Superadmin inicial criado.');
}

async function initDatabase() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await exec(schema);
  await ensureTenantColumns();
  await ensureUserColumns();
  await ensureRecommendationsTable();
  await ensureBugReportsTable();
  await ensureAppointmentColumns();
  await ensureServiceHistoryTable();
  await seedDefaultSuperadmin();
  console.log('Banco de dados pronto.');
}

async function ensureTenantColumns() {
  const column = await get(
     `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'tenants'
       AND column_name = 'border_color'`
  );
  if (!column) {
    await run("ALTER TABLE tenants ADD COLUMN border_color TEXT NOT NULL DEFAULT '#3f3f46'");
  }
  await run("UPDATE tenants SET theme_color = '#d4d4d8' WHERE theme_color = '#1a73e8'");
}

async function ensureUserColumns() {
  const columns = await db.all(
     `SELECT column_name AS name
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'users'`
  );
  const columnNames = columns.map((column) => column.name);
  if (!columnNames.includes('admin_notes')) {
    await run("ALTER TABLE users ADD COLUMN admin_notes TEXT DEFAULT ''");
  }
  if (!columnNames.includes('billing_type')) {
    await run("ALTER TABLE users ADD COLUMN billing_type TEXT NOT NULL DEFAULT 'subscription'");
  }
}

async function ensureRecommendationsTable() {
  await exec(`
    CREATE TABLE IF NOT EXISTS recommendations (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      client_name TEXT NOT NULL,
      barbershop_name TEXT NOT NULL,
      recommendation TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function ensureBugReportsTable() {
  await exec(`
    CREATE TABLE IF NOT EXISTS bug_reports (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      client_name TEXT NOT NULL,
      barbershop_name TEXT NOT NULL,
      description TEXT NOT NULL,
      resolved_at TIMESTAMP DEFAULT NULL,
      resolution_message TEXT DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const columns = await db.all(
     `SELECT column_name AS name
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'bug_reports'`
  );
  const columnNames = columns.map((column) => column.name);
  if (!columnNames.includes('resolved_at')) {
    await run('ALTER TABLE bug_reports ADD COLUMN resolved_at TIMESTAMP DEFAULT NULL');
  }
  if (!columnNames.includes('resolution_message')) {
    await run("ALTER TABLE bug_reports ADD COLUMN resolution_message TEXT DEFAULT ''");
  }
}

async function ensureAppointmentColumns() {
  const appointmentColumns = await db.all(
    `SELECT column_name AS name
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'appointments'`
  );
  const appointmentColumnNames = appointmentColumns.map((column) => column.name);
  if (!appointmentColumnNames.includes('payment_proof_name')) {
    await run("ALTER TABLE appointments ADD COLUMN payment_proof_name TEXT DEFAULT ''");
  }
  if (!appointmentColumnNames.includes('payment_proof_data')) {
    await run("ALTER TABLE appointments ADD COLUMN payment_proof_data TEXT DEFAULT ''");
  }
}

async function ensureServiceHistoryTable() {
  await exec(`
    CREATE TABLE IF NOT EXISTS service_history (
      id SERIAL PRIMARY KEY,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      appointment_id INTEGER,
      client_name TEXT NOT NULL,
      client_phone TEXT DEFAULT '',
      appointment_date TIMESTAMP NOT NULL,
      total NUMERIC(10, 2) NOT NULL DEFAULT 0,
      payment_type TEXT DEFAULT 'dinheiro',
      payment_status TEXT DEFAULT 'ja pago',
      payment_proof_name TEXT DEFAULT '',
      payment_proof_data TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      services JSONB NOT NULL DEFAULT '[]'::jsonb,
      completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const historyColumns = await db.all(
    `SELECT column_name AS name
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'service_history'`
  );
  const historyColumnNames = historyColumns.map((column) => column.name);
  if (!historyColumnNames.includes('payment_proof_name')) {
    await run("ALTER TABLE service_history ADD COLUMN payment_proof_name TEXT DEFAULT ''");
  }
  if (!historyColumnNames.includes('payment_proof_data')) {
    await run("ALTER TABLE service_history ADD COLUMN payment_proof_data TEXT DEFAULT ''");
  }
}

if (require.main === module) {
  initDatabase()
    .then(() => db.close())
    .catch((error) => {
      console.error('Erro ao inicializar banco:', error);
      db.close();
      process.exit(1);
    });
}

module.exports = { initDatabase };
