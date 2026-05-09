const db = require('../config/db');

function listClients(tenantId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, name, phone, notes, created_at FROM clients WHERE tenant_id = ? ORDER BY name',
      [tenantId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

function createClient(tenantId, name, phone, notes) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO clients (tenant_id, name, phone, notes) VALUES (?, ?, ?, ?)',
      [tenantId, name, phone, notes],
      function (err) {
        if (err) return reject(err);
        db.get('SELECT id, name, phone, notes, created_at FROM clients WHERE id = ?', [this.lastID], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      }
    );
  });
}

function getClientById(id, tenantId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, name, phone, notes FROM clients WHERE id = ? AND tenant_id = ?', [id, tenantId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function updateClient(id, tenantId, name, phone, notes) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE clients SET name = ?, phone = ?, notes = ? WHERE id = ? AND tenant_id = ?',
      [name, phone, notes, id, tenantId],
      function (err) {
        if (err) return reject(err);
        db.get('SELECT id, name, phone, notes FROM clients WHERE id = ?', [id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      }
    );
  });
}

function deleteClient(id, tenantId) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM clients WHERE id = ? AND tenant_id = ?', [id, tenantId], function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = { listClients, createClient, getClientById, updateClient, deleteClient };
