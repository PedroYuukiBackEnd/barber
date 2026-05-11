const db = require('../config/db');

function createRecommendation(tenantId, userId, clientName, barbershopName, recommendation, attachmentName = '', attachmentData = '') {
  return new Promise((resolve, reject) => {
    db.get(
      `INSERT INTO recommendations (tenant_id, user_id, client_name, barbershop_name, recommendation, attachment_name, attachment_data)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING id, tenant_id, user_id, client_name, barbershop_name, recommendation, attachment_name, attachment_data, created_at`,
      [tenantId, userId, clientName, barbershopName, recommendation, attachmentName, attachmentData],
      (err, row) => {
        if (err) return reject(err);
        resolve(row);
      }
    );
  });
}

module.exports = { createRecommendation };
