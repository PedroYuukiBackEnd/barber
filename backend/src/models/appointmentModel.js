const db = require('../config/db');

function listAppointments(tenantId) {
  return new Promise((resolve, reject) => {
    // First get appointments
    db.all(
      `SELECT
         a.id,
         a.client_id,
         c.name AS client_name,
         c.phone AS client_phone,
         a.appointment_date,
         a.total,
         a.notes
       FROM appointments a
       JOIN clients c ON c.id = a.client_id
       WHERE a.tenant_id = ?
       ORDER BY a.appointment_date DESC`,
      [tenantId],
      (err, appointments) => {
        if (err) return reject(err);

        // Then get services for each appointment
        const appointmentIds = appointments.map(a => a.id);
        if (appointmentIds.length === 0) {
          resolve(appointments.map(a => ({ ...a, services: [] })));
          return;
        }

        const placeholders = appointmentIds.map(() => '?').join(',');
        db.all(
          `SELECT
             appointment_id,
             service_id,
             service_name,
             service_price
           FROM appointment_services
           WHERE appointment_id IN (${placeholders})`,
          appointmentIds,
          (err, services) => {
            if (err) return reject(err);

            // Group services by appointment_id
            const servicesByAppointment = {};
            services.forEach(service => {
              if (!servicesByAppointment[service.appointment_id]) {
                servicesByAppointment[service.appointment_id] = [];
              }
              servicesByAppointment[service.appointment_id].push({
                service_id: service.service_id,
                service_name: service.service_name,
                service_price: service.service_price
              });
            });

            // Combine appointments with their services
            const result = appointments.map(appointment => ({
              ...appointment,
              services: servicesByAppointment[appointment.id] || []
            }));

            resolve(result);
          }
        );
      }
    );
  });
}

function createAppointment(tenantId, clientId, appointmentDate, total, notes, services) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO appointments (tenant_id, client_id, appointment_date, total, notes) VALUES (?, ?, ?, ?, ?)',
      [tenantId, clientId, appointmentDate, total, notes],
      function (err) {
        if (err) return reject(err);
        const appointmentId = this.lastID;
        const serviceInserts = services.map(service => ({
          appointment_id: appointmentId,
          service_id: service.id,
          service_name: service.name,
          service_price: service.price
        }));
        const stmt = db.prepare('INSERT INTO appointment_services (appointment_id, service_id, service_name, service_price) VALUES (?, ?, ?, ?)');
        serviceInserts.forEach(insert => {
          stmt.run(insert.appointment_id, insert.service_id, insert.service_name, insert.service_price);
        });
        stmt.finalize();
        db.get('SELECT id, appointment_date, total, notes FROM appointments WHERE id = ?', [appointmentId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      }
    );
  });
}

function getAppointmentById(id, tenantId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, client_id, appointment_date, total, notes FROM appointments WHERE id = ? AND tenant_id = ?', [id, tenantId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function deleteAppointmentServices(appointmentId) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM appointment_services WHERE appointment_id = ?', [appointmentId], function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

function updateAppointment(id, tenantId, clientId, appointmentDate, total, notes, services) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE appointments SET client_id = ?, appointment_date = ?, total = ?, notes = ? WHERE id = ? AND tenant_id = ?',
      [clientId, appointmentDate, total, notes, id, tenantId],
      function (err) {
        if (err) return reject(err);
        deleteAppointmentServices(id).then(() => {
          const serviceInserts = services.map(service => ({
            appointment_id: id,
            service_id: service.id,
            service_name: service.name,
            service_price: service.price
          }));
          const stmt = db.prepare('INSERT INTO appointment_services (appointment_id, service_id, service_name, service_price) VALUES (?, ?, ?, ?)');
          serviceInserts.forEach(insert => {
            stmt.run(insert.appointment_id, insert.service_id, insert.service_name, insert.service_price);
          });
          stmt.finalize();
          db.get('SELECT id, appointment_date, total, notes FROM appointments WHERE id = ?', [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        }).catch(reject);
      }
    );
  });
}

function deleteAppointment(id, tenantId) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM appointments WHERE id = ? AND tenant_id = ?', [id, tenantId], function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = { listAppointments, createAppointment, getAppointmentById, updateAppointment, deleteAppointment };