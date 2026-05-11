const db = require('../config/db');

function createTenant(name) {
  return new Promise((resolve, reject) => {
    db.get(
      'INSERT INTO tenants (name) VALUES (?) RETURNING id, name, theme_color, logo_url',
      [name],
      (err, row) => {
        if (err) return reject(err);
        resolve(row);
      }
    );
  });
}

function getTenantById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, name, theme_color, logo_url FROM tenants WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function updateTenant(id, fields) {
  return new Promise((resolve, reject) => {
    const updates = [];
    const values = [];
    if (fields.name) {
      values.push(fields.name);
      updates.push('name = ?');
    }
    if (fields.theme_color) {
      values.push(fields.theme_color);
      updates.push('theme_color = ?');
    }
    if (fields.logo_url) {
      values.push(fields.logo_url);
      updates.push('logo_url = ?');
    }
    if (!updates.length) {
      return getTenantById(id);
    }
    values.push(id);
    db.run(
      `UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`,
      values,
      function (err) {
        if (err) return reject(err);
        getTenantById(id).then(resolve).catch(reject);
      }
    );
  });
}

module.exports = { createTenant, getTenantById, updateTenant };
