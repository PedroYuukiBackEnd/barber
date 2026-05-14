const path = require('path');
const fs = require('fs');
const runtimeDir = process.pkg ? path.dirname(process.execPath) : path.join(__dirname, '../..');
require('dotenv').config({ path: path.join(runtimeDir, '.env') });
const db = require('../config/db');
const { hashPassword } = require('../utils/password');

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

async function tableColumns(tableName) {
  const columns = await db.all(`PRAGMA table_info(${tableName})`);
  return columns.map((column) => column.name);
}

async function seedDefaultSuperadmin() {
  const adminName = process.env.DEFAULT_SUPERADMIN_NAME || 'Admin Local';
  const adminEmail = process.env.DEFAULT_SUPERADMIN_EMAIL || 'localadmin';
  const adminPassword = process.env.DEFAULT_SUPERADMIN_PASSWORD || 'localadmin123';
  const tenantName = process.env.DEFAULT_PLATFORM_TENANT_NAME || 'Plataforma Local';

  const existingUser = await get('SELECT id FROM users WHERE email = ?', [adminEmail]);
  if (existingUser) {
    const passwordHash = hashPassword(adminPassword);
    await run('UPDATE users SET name = ?, password_hash = ?, role = ? WHERE id = ?', [
      adminName,
      passwordHash,
      'superadmin',
      existingUser.id,
    ]);
    console.log('Usuario existente promovido para superadmin.');
    return;
  }

  const superadminCount = await get("SELECT COUNT(*) AS count FROM users WHERE role = 'superadmin'");
  if (Number(superadminCount.count) > 0) return;

  const passwordHash = hashPassword(adminPassword);
  const tenant = await run('INSERT INTO tenants (name) VALUES (?)', [tenantName]);
  await run(
    'INSERT INTO users (tenant_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [tenant.lastID, adminName, adminEmail, passwordHash, 'superadmin']
  );

  console.log('Superadmin local inicial criado.');
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
  console.log('Banco de dados local pronto.');
}

async function ensureTenantColumns() {
  const columnNames = await tableColumns('tenants');
  if (!columnNames.includes('border_color')) {
    await run("ALTER TABLE tenants ADD COLUMN border_color TEXT NOT NULL DEFAULT '#3f3f46'");
  }
  if (!columnNames.includes('require_pix_proof_to_finish')) {
    await run('ALTER TABLE tenants ADD COLUMN require_pix_proof_to_finish INTEGER NOT NULL DEFAULT 0');
  }
  await run("UPDATE tenants SET theme_color = '#d4d4d8' WHERE theme_color = '#1a73e8'");
}

async function ensureUserColumns() {
  const columnNames = await tableColumns('users');
  if (!columnNames.includes('admin_notes')) {
    await run("ALTER TABLE users ADD COLUMN admin_notes TEXT DEFAULT ''");
  }
  if (!columnNames.includes('billing_type')) {
    await run("ALTER TABLE users ADD COLUMN billing_type TEXT NOT NULL DEFAULT 'subscription'");
  }
  if (!columnNames.includes('billing_cycle_started_at')) {
    await run('ALTER TABLE users ADD COLUMN billing_cycle_started_at TEXT');
    await run('UPDATE users SET billing_cycle_started_at = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE billing_cycle_started_at IS NULL');
  }
  if (!columnNames.includes('billing_paid_at')) {
    await run('ALTER TABLE users ADD COLUMN billing_paid_at TEXT DEFAULT NULL');
  }
  if (!columnNames.includes('billing_proof_name')) {
    await run("ALTER TABLE users ADD COLUMN billing_proof_name TEXT DEFAULT ''");
  }
  if (!columnNames.includes('billing_proof_data')) {
    await run("ALTER TABLE users ADD COLUMN billing_proof_data TEXT DEFAULT ''");
  }
}

async function ensureRecommendationsTable() {
  await exec(`
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
  `);
  const columnNames = await tableColumns('recommendations');
  if (!columnNames.includes('attachment_name')) {
    await run("ALTER TABLE recommendations ADD COLUMN attachment_name TEXT DEFAULT ''");
  }
  if (!columnNames.includes('attachment_data')) {
    await run("ALTER TABLE recommendations ADD COLUMN attachment_data TEXT DEFAULT ''");
  }
}

async function ensureBugReportsTable() {
  await exec(`
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
  `);
  const columnNames = await tableColumns('bug_reports');
  if (!columnNames.includes('resolved_at')) {
    await run('ALTER TABLE bug_reports ADD COLUMN resolved_at TEXT DEFAULT NULL');
  }
  if (!columnNames.includes('resolution_message')) {
    await run("ALTER TABLE bug_reports ADD COLUMN resolution_message TEXT DEFAULT ''");
  }
  if (!columnNames.includes('attachment_name')) {
    await run("ALTER TABLE bug_reports ADD COLUMN attachment_name TEXT DEFAULT ''");
  }
  if (!columnNames.includes('attachment_data')) {
    await run("ALTER TABLE bug_reports ADD COLUMN attachment_data TEXT DEFAULT ''");
  }
}

async function ensureAppointmentColumns() {
  const columnNames = await tableColumns('appointments');
  if (!columnNames.includes('payment_proof_name')) {
    await run("ALTER TABLE appointments ADD COLUMN payment_proof_name TEXT DEFAULT ''");
  }
  if (!columnNames.includes('payment_proof_data')) {
    await run("ALTER TABLE appointments ADD COLUMN payment_proof_data TEXT DEFAULT ''");
  }
  if (!columnNames.includes('note_attachment_name')) {
    await run("ALTER TABLE appointments ADD COLUMN note_attachment_name TEXT DEFAULT ''");
  }
  if (!columnNames.includes('note_attachment_data')) {
    await run("ALTER TABLE appointments ADD COLUMN note_attachment_data TEXT DEFAULT ''");
  }
}

async function ensureServiceHistoryTable() {
  await exec(`
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
  `);
  const columnNames = await tableColumns('service_history');
  if (!columnNames.includes('payment_proof_name')) {
    await run("ALTER TABLE service_history ADD COLUMN payment_proof_name TEXT DEFAULT ''");
  }
  if (!columnNames.includes('payment_proof_data')) {
    await run("ALTER TABLE service_history ADD COLUMN payment_proof_data TEXT DEFAULT ''");
  }
  if (!columnNames.includes('note_attachment_name')) {
    await run("ALTER TABLE service_history ADD COLUMN note_attachment_name TEXT DEFAULT ''");
  }
  if (!columnNames.includes('note_attachment_data')) {
    await run("ALTER TABLE service_history ADD COLUMN note_attachment_data TEXT DEFAULT ''");
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
