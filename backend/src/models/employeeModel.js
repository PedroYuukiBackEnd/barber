const db = require('../config/db');

function listEmployees(tenantId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, name, phone, notes, gender, specialty, monthly_goal, created_at FROM employees WHERE tenant_id = ? ORDER BY name',
      [tenantId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

function getEmployeeById(id, tenantId) {
  return new Promise((resolve, reject) => {
    if (!id) return resolve(null);
    db.get(
      'SELECT id, name, phone, notes, gender, specialty, monthly_goal FROM employees WHERE id = ? AND tenant_id = ?',
      [id, tenantId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      }
    );
  });
}

function createEmployee(tenantId, name, phone, notes, gender, specialty, monthlyGoal) {
  return new Promise((resolve, reject) => {
    db.get(
      `INSERT INTO employees (tenant_id, name, phone, notes, gender, specialty, monthly_goal)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING id, name, phone, notes, gender, specialty, monthly_goal, created_at`,
      [tenantId, name, phone, notes, gender, specialty, monthlyGoal],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

function updateEmployee(id, tenantId, name, phone, notes, gender, specialty, monthlyGoal) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE employees SET name = ?, phone = ?, notes = ?, gender = ?, specialty = ?, monthly_goal = ? WHERE id = ? AND tenant_id = ?',
      [name, phone, notes, gender, specialty, monthlyGoal, id, tenantId],
      function (err) {
        if (err) return reject(err);
        db.get('SELECT id, name, phone, notes, gender, specialty, monthly_goal, created_at FROM employees WHERE id = ? AND tenant_id = ?', [id, tenantId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      }
    );
  });
}

function deleteEmployee(id, tenantId) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM employees WHERE id = ? AND tenant_id = ?', [id, tenantId], function (err) {
      if (err) reject(err);
      else resolve({ deleted: this.changes > 0 });
    });
  });
}

module.exports = { listEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee };
