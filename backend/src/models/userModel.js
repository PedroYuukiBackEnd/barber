const db = require('../config/db');

function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, tenant_id, name, email, password_hash, role FROM users WHERE email = ?', [email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, tenant_id, name, email, role FROM users WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function createUser(tenantId, name, email, passwordHash) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (tenant_id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [tenantId, name, email, passwordHash],
      function (err) {
        if (err) return reject(err);
        db.get('SELECT id, tenant_id, name, email, role FROM users WHERE id = ?', [this.lastID], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      }
    );
  });
}

module.exports = { getUserByEmail, getUserById, createUser };
