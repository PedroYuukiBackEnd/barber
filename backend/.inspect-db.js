const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');
db.serialize(() => {
  db.all('SELECT id,email,name,role,created_at FROM users', [], (err, rows) => {
    if (err) { console.error(err.message); process.exit(1); }
    console.log('USERS:' + JSON.stringify(rows, null, 2));
  });
  db.all('SELECT id,name,created_at FROM tenants', [], (err, rows) => {
    if (err) { console.error(err.message); process.exit(1); }
    console.log('TENANTS:' + JSON.stringify(rows, null, 2));
  });
});
