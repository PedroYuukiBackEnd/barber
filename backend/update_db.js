const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
  db.run("ALTER TABLE appointments ADD COLUMN payment_status TEXT DEFAULT 'a pagar'", (err) => {
    if (err) {
      console.log('Error or already exists: ', err.message);
    } else {
      console.log('Column payment_status added successfully.');
    }
  });
});
