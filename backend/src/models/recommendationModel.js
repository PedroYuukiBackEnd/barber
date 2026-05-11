const db = require('../config/db');

function createRecommendation(tenantId, userId, clientName, barbershopName, recommendation) {
  return new Promise((resolve, reject) => {
    db.get(
      `INSERT INTO recommendations (tenant_id, user_id, client_name, barbershop_name, recommendation)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id, tenant_id, user_id, client_name, barbershop_name, recommendation, created_at`,
      [tenantId, userId, clientName, barbershopName, recommendation],
      (err, row) => {
        if (err) return reject(err);
        resolve(row);
      }
    );
  });
}

module.exports = { createRecommendation };
