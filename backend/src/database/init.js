const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, '../../database.sqlite');
const schemaPath = path.join(__dirname, 'schema.sql');

if (fs.existsSync(dbPath)) {
  console.log('Banco de dados já existe. Remova o arquivo database.sqlite se quiser recriar.');
  process.exit(0);
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao criar banco:', err.message);
    process.exit(1);
  }
  console.log('Banco de dados criado.');
});

const schema = fs.readFileSync(schemaPath, 'utf8');
const statements = schema.split(';').filter(stmt => stmt.trim());

let index = 0;
function runNext() {
  if (index >= statements.length) {
    console.log('Schema executado. Inserindo usuários admin...');
    insertAdmins();
    return;
  }
  const stmt = statements[index].trim();
  if (stmt) {
    db.run(stmt, (err) => {
      if (err) {
        console.error('Erro na query:', stmt, err.message);
        process.exit(1);
      }
      index++;
      runNext();
    });
  } else {
    index++;
    runNext();
  }
}

async function insertAdmins() {
  try {
    // Hash das senhas
    const hash1 = await bcrypt.hash('pedroyuuki2008', 10);
    const hash2 = await bcrypt.hash('pablocunascentedepetroleo', 10);

    // Inserir tenants
    db.run('INSERT INTO tenants (name) VALUES (?)', ['Barbearia Pedro'], function(err) {
      if (err) console.error(err);
      const tenantId1 = this.lastID;
      db.run('INSERT INTO users (tenant_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', [tenantId1, 'Pedro Yuuki Onisi Tanaka', 'Pedro Yuuki Onisi Tanaka', hash1, 'admin']);
    });

    db.run('INSERT INTO tenants (name) VALUES (?)', ['Barbearia Pablo'], function(err) {
      if (err) console.error(err);
      const tenantId2 = this.lastID;
      db.run('INSERT INTO users (tenant_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)', [tenantId2, 'Pablo André doa cu', 'Pablo André doa cu', hash2, 'admin']);
    });

    console.log('Usuários admin inseridos.');
    db.close();
  } catch (error) {
    console.error('Erro ao inserir admins:', error);
    db.close();
  }
}

runNext();