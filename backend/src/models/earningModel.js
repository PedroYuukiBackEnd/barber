const db = require('../config/db');

function listManualEarnings(tenantId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, amount, description, entry_date, created_at
       FROM manual_earnings
       WHERE tenant_id = ?
       ORDER BY entry_date DESC, created_at DESC`,
      [tenantId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

function createManualEarning(tenantId, amount, description, entryDate) {
  return new Promise((resolve, reject) => {
    db.get(
      `INSERT INTO manual_earnings (tenant_id, amount, description, entry_date)
       VALUES (?, ?, ?, ?)
       RETURNING id, amount, description, entry_date, created_at`,
      [tenantId, amount, description, entryDate],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

function deleteManualEarning(id, tenantId) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM manual_earnings WHERE id = ? AND tenant_id = ?', [id, tenantId], function (err) {
      if (err) reject(err);
      else resolve({ deleted: this.changes > 0 });
    });
  });
}

module.exports = { listManualEarnings, createManualEarning, deleteManualEarning };
