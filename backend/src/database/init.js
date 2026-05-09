const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

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
    console.log('Banco inicializado com sucesso.');
    db.close();
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

runNext();