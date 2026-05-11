const db = require('../config/db');

function createBugReport(tenantId, userId, clientName, barbershopName, description, attachmentName = '', attachmentData = '') {
  return new Promise((resolve, reject) => {
    db.get(
      `INSERT INTO bug_reports (tenant_id, user_id, client_name, barbershop_name, description, attachment_name, attachment_data)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING id, tenant_id, user_id, client_name, barbershop_name, description, attachment_name, attachment_data, created_at`,
      [tenantId, userId, clientName, barbershopName, description, attachmentName, attachmentData],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

function listUserBugReports(tenantId, userId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, client_name, barbershop_name, description, attachment_name, attachment_data, resolved_at, resolution_message, created_at
       FROM bug_reports
       WHERE tenant_id = ? AND user_id = ?
       ORDER BY created_at DESC`,
      [tenantId, userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

module.exports = { createBugReport, listUserBugReports };
