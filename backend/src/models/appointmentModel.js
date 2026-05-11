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
         to_char(a.appointment_date, 'YYYY-MM-DD"T"HH24:MI') AS appointment_date,
         a.total,
         a.payment_type,
         a.payment_status,
         a.payment_proof_name,
         a.payment_proof_data,
         a.note_attachment_name,
         a.note_attachment_data,
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

function createAppointment(tenantId, clientId, appointmentDate, total, paymentType, paymentStatus, paymentProofName, paymentProofData, noteAttachmentName, noteAttachmentData, notes, services) {
  return new Promise((resolve, reject) => {
    db.get(
      'INSERT INTO appointments (tenant_id, client_id, appointment_date, total, payment_type, payment_status, payment_proof_name, payment_proof_data, note_attachment_name, note_attachment_data, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
      [tenantId, clientId, appointmentDate, total, paymentType, paymentStatus, paymentProofName, paymentProofData, noteAttachmentName, noteAttachmentData, notes],
      async (err, inserted) => {
        if (err) return reject(err);
        const appointmentId = inserted.id;
        try {
          await Promise.all(services.map((service) => db.run(
            'INSERT INTO appointment_services (appointment_id, service_id, service_name, service_price) VALUES (?, ?, ?, ?)',
            [appointmentId, service.id, service.name, service.price]
          )));

          db.get(`SELECT id, to_char(appointment_date, 'YYYY-MM-DD"T"HH24:MI') AS appointment_date, total, payment_status, payment_proof_name, payment_proof_data, note_attachment_name, note_attachment_data, notes FROM appointments WHERE id = ?`, [appointmentId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
}

function getAppointmentById(id, tenantId) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id, client_id, to_char(appointment_date, 'YYYY-MM-DD"T"HH24:MI') AS appointment_date, total, payment_type, payment_status, payment_proof_name, payment_proof_data, note_attachment_name, note_attachment_data, notes FROM appointments WHERE id = ? AND tenant_id = ?`, [id, tenantId], (err, row) => {
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

function updateAppointment(id, tenantId, clientId, appointmentDate, total, paymentType, paymentStatus, paymentProofName, paymentProofData, noteAttachmentName, noteAttachmentData, notes, services) {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE appointments SET client_id = ?, appointment_date = ?, total = ?, payment_type = ?, payment_status = ?, payment_proof_name = ?, payment_proof_data = ?, note_attachment_name = ?, note_attachment_data = ?, notes = ? WHERE id = ? AND tenant_id = ?',
      [clientId, appointmentDate, total, paymentType, paymentStatus, paymentProofName, paymentProofData, noteAttachmentName, noteAttachmentData, notes, id, tenantId],
      function (err) {
        if (err) return reject(err);
        deleteAppointmentServices(id).then(async () => {
          await Promise.all(services.map((service) => db.run(
            'INSERT INTO appointment_services (appointment_id, service_id, service_name, service_price) VALUES (?, ?, ?, ?)',
            [id, service.id, service.name, service.price]
          )));

          db.get(`SELECT id, to_char(appointment_date, 'YYYY-MM-DD"T"HH24:MI') AS appointment_date, total, payment_status, payment_proof_name, payment_proof_data, note_attachment_name, note_attachment_data, notes FROM appointments WHERE id = ?`, [id], (err, row) => {
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

async function getAppointmentSnapshot(id, tenantId) {
  const appointment = await new Promise((resolve, reject) => {
    db.get(
      `SELECT
         a.id,
         a.client_id,
         c.name AS client_name,
         c.phone AS client_phone,
         to_char(a.appointment_date, 'YYYY-MM-DD"T"HH24:MI') AS appointment_date,
         a.total,
         a.payment_type,
         a.payment_status,
         a.payment_proof_name,
         a.payment_proof_data,
         a.note_attachment_name,
         a.note_attachment_data,
         a.notes
       FROM appointments a
       JOIN clients c ON c.id = a.client_id
       WHERE a.id = ? AND a.tenant_id = ?`,
      [id, tenantId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!appointment) return null;

  const services = await new Promise((resolve, reject) => {
    db.all(
      `SELECT service_id, service_name, service_price
       FROM appointment_services
       WHERE appointment_id = ?
       ORDER BY id`,
      [id],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  return { ...appointment, services };
}

async function finishAppointment(id, tenantId) {
  const appointment = await getAppointmentSnapshot(id, tenantId);
  if (!appointment) return null;

  const history = await new Promise((resolve, reject) => {
    db.get(
      `INSERT INTO service_history (
         tenant_id,
         appointment_id,
         client_name,
         client_phone,
         appointment_date,
         total,
         payment_type,
         payment_status,
         payment_proof_name,
         payment_proof_data,
         note_attachment_name,
         note_attachment_data,
         notes,
         services
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb)
       RETURNING id, tenant_id, appointment_id, client_name, client_phone,
                 to_char(appointment_date, 'YYYY-MM-DD"T"HH24:MI') AS appointment_date,
                 total, payment_type, payment_status, payment_proof_name, payment_proof_data, note_attachment_name, note_attachment_data, notes, services,
                 to_char(completed_at, 'YYYY-MM-DD"T"HH24:MI') AS completed_at`,
      [
        tenantId,
        appointment.id,
        appointment.client_name,
        appointment.client_phone || '',
        appointment.appointment_date,
        appointment.total,
        appointment.payment_type || 'dinheiro',
        appointment.payment_status || 'ja pago',
        appointment.payment_proof_name || '',
        appointment.payment_proof_data || '',
        appointment.note_attachment_name || '',
        appointment.note_attachment_data || '',
        appointment.notes || '',
        JSON.stringify(appointment.services || []),
      ],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  await deleteAppointment(id, tenantId);
  return history;
}

function listServiceHistory(tenantId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, appointment_id, client_name, client_phone,
              to_char(appointment_date, 'YYYY-MM-DD"T"HH24:MI') AS appointment_date,
              total, payment_type, payment_status, payment_proof_name, payment_proof_data, note_attachment_name, note_attachment_data, notes, services,
              to_char(completed_at, 'YYYY-MM-DD"T"HH24:MI') AS completed_at
       FROM service_history
       WHERE tenant_id = ?
       ORDER BY completed_at DESC`,
      [tenantId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

module.exports = {
  listAppointments,
  createAppointment,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  finishAppointment,
  listServiceHistory,
};
