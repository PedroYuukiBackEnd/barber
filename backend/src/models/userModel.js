const db = require('../config/db');

function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, tenant_id, name, email, password_hash, role FROM users WHERE email = ?', [email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getUserByEmailOrName(access) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, tenant_id, name, email, password_hash, role FROM users WHERE email = ? OR name = ?',
      [access, access],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
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

function createUser(tenantId, name, email, passwordHash, role = 'admin') {
  return new Promise((resolve, reject) => {
    db.get(
      'INSERT INTO users (tenant_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?) RETURNING id, tenant_id, name, email, role',
      [tenantId, name, email, passwordHash, role],
      (err, row) => {
        if (err) return reject(err);
        resolve(row);
      }
    );
  });
}

function updateUser(id, name, email, role, passwordHash) {
  return new Promise((resolve, reject) => {
    const query = passwordHash
      ? 'UPDATE users SET name = ?, email = ?, role = ?, password_hash = ? WHERE id = ?'
      : 'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?';
    const params = passwordHash
      ? [name, email, role, passwordHash, id]
      : [name, email, role, id];

    db.run(query, params, function (err) {
      if (err) return reject(err);
      db.get('SELECT id, tenant_id, name, email, role, created_at FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  });
}

module.exports = { getUserByEmail, getUserByEmailOrName, getUserById, createUser, updateUser };
