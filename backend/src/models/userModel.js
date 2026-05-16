const db = require('../config/db');
const { normalizeAccess, normalizeAccessKey } = require('../utils/access');

function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, tenant_id, name, email, password_hash, role FROM users WHERE lower(email) = lower(?)', [normalizeAccess(email)], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function getUserByEmailOrName(access) {
  const normalizedAccess = normalizeAccess(access);
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, tenant_id, name, email, password_hash, role FROM users WHERE lower(email) = lower(?) OR lower(name) = lower(?)',
      [normalizedAccess, normalizedAccess],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, tenant_id, name, email, role, billing_type, admin_notes FROM users WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function createUser(tenantId, name, email, passwordHash, role = 'user', adminNotes = '', billingType = 'subscription') {
  const normalizedEmail = normalizeAccessKey(email);
  return new Promise((resolve, reject) => {
    db.get(
      'INSERT INTO users (tenant_id, name, email, password_hash, role, admin_notes, billing_type) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id, tenant_id, name, email, role, admin_notes, billing_type',
      [tenantId, normalizeAccess(name), normalizedEmail, passwordHash, role, adminNotes, billingType],
      (err, row) => {
        if (err) return reject(err);
        resolve(row);
      }
    );
  });
}

function updateUser(id, name, email, role, billingType, adminNotes, passwordHash) {
  const normalizedEmail = normalizeAccessKey(email);
  return new Promise((resolve, reject) => {
    const query = passwordHash
      ? 'UPDATE users SET name = ?, email = ?, role = ?, billing_type = ?, admin_notes = ?, password_hash = ? WHERE id = ?'
      : 'UPDATE users SET name = ?, email = ?, role = ?, billing_type = ?, admin_notes = ? WHERE id = ?';
    const params = passwordHash
      ? [normalizeAccess(name), normalizedEmail, role, billingType, adminNotes, passwordHash, id]
      : [normalizeAccess(name), normalizedEmail, role, billingType, adminNotes, id];

    db.run(query, params, function (err) {
      if (err) return reject(err);
      db.get('SELECT id, tenant_id, name, email, role, billing_type, admin_notes, created_at FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  });
}

module.exports = { getUserByEmail, getUserByEmailOrName, getUserById, createUser, updateUser };
