const path = require('path');
const fs = require('fs');
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

async function seedDefaultAdmin() {
  const adminCount = await get('SELECT COUNT(*) AS count FROM users');
  if (adminCount.count > 0) return;

  const adminName = process.env.DEFAULT_ADMIN_NAME || 'Pedro Yuuki Onisi Tanaka';
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || adminName;
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'pedroyuuki2008';
  const tenantName = process.env.DEFAULT_TENANT_NAME || 'Barbearia Pedro';

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const tenant = await run('INSERT INTO tenants (name) VALUES (?)', [tenantName]);
  await run(
    'INSERT INTO users (tenant_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
    [tenant.lastID, adminName, adminEmail, passwordHash, 'admin']
  );

  console.log('Usuario admin padrao criado.');
}

async function initDatabase() {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await exec(schema);
  await seedDefaultAdmin();
  console.log('Banco de dados pronto.');
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
