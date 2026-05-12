const db = require('../config/db');

function createTenant(name) {
  return new Promise((resolve, reject) => {
    db.get(
      'INSERT INTO tenants (name) VALUES (?) RETURNING id, name, theme_color, border_color, logo_url, require_pix_proof_to_finish',
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
    db.get('SELECT id, name, theme_color, border_color, logo_url, require_pix_proof_to_finish FROM tenants WHERE id = ?', [id], (err, row) => {
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
    if (fields.border_color) {
      values.push(fields.border_color);
      updates.push('border_color = ?');
    }
    if (fields.logo_url) {
      values.push(fields.logo_url);
      updates.push('logo_url = ?');
    }
    if (fields.require_pix_proof_to_finish !== undefined) {
      values.push(Boolean(fields.require_pix_proof_to_finish));
      updates.push('require_pix_proof_to_finish = ?');
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
