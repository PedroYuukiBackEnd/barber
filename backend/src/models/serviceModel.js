const db = require('../config/db');

function listServices(tenantId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, name, price, description, created_at FROM services WHERE tenant_id = ? ORDER BY name',
      [tenantId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

function createService(tenantId, name, price, description) {
  return new Promise((resolve, reject) => {
    db.get(
      'INSERT INTO services (tenant_id, name, price, description) VALUES (?, ?, ?, ?) RETURNING id, name, price, description, created_at',
      [tenantId, name, price, description],
      (err, row) => {
        if (err) return reject(err);
        resolve(row);
      }
    );
  });
}

function getServiceById(id, tenantId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, name, price, description FROM services WHERE id = ? AND tenant_id = ?', [id, tenantId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function updateService(id, tenantId, name, price, description) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE services SET name = ?, price = ?, description = ? WHERE id = ? AND tenant_id = ?',
      [name, price, description, id, tenantId],
      function (err) {
        if (err) return reject(err);
        db.get('SELECT id, name, price, description FROM services WHERE id = ?', [id], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      }
    );
  });
}

function deleteService(id, tenantId) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM services WHERE id = ? AND tenant_id = ?', [id, tenantId], function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

function listServicesByIds(serviceIds, tenantId) {
  return new Promise((resolve, reject) => {
    const placeholders = serviceIds.map(() => '?').join(',');
    db.all(
      `SELECT id, name, price FROM services WHERE tenant_id = ? AND id IN (${placeholders})`,
      [tenantId, ...serviceIds],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

module.exports = { listServices, createService, getServiceById, updateService, deleteService, listServicesByIds };
