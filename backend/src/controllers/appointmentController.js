const db = require('../config/db');
const { listAppointments, createAppointment, getAppointmentById, updateAppointment, deleteAppointment } = require('../models/appointmentModel');
const { getClientById } = require('../models/clientModel');
const { listServicesByIds } = require('../models/serviceModel');

async function listAppointmentsHandler(req, res, next) {
  try {
    const appointments = await listAppointments(req.user.tenant_id);
    res.json({ appointments });
  } catch (error) {
    next(error);
  }
}

async function createAppointmentHandler(req, res, next) {
  try {
    const { client_id, appointment_date, service_ids, payment_type, payment_status, notes } = req.body;
    if (!client_id || !appointment_date || !Array.isArray(service_ids) || service_ids.length === 0) {
      return res.status(400).json({ message: 'Cliente, data e pelo menos um serviço são obrigatórios.' });
    }

    const client = await getClientById(client_id, req.user.tenant_id);
    if (!client) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }

    const services = await listServicesByIds(service_ids, req.user.tenant_id);
    if (services.length !== service_ids.length) {
      return res.status(400).json({ message: 'Um ou mais serviços não são válidos.' });
    }

    const total = services.reduce((sum, service) => sum + Number(service.price), 0);
    const appointment = await createAppointment(req.user.tenant_id, client_id, appointment_date, total, payment_type || 'dinheiro', payment_status || 'a pagar', notes || '', services);
    res.status(201).json({ appointment });
  } catch (error) {
    next(error);
  }
}

async function updateAppointmentHandler(req, res, next) {
  try {
    const appointmentId = Number(req.params.id);
    const { client_id, appointment_date, service_ids, payment_type, payment_status, notes } = req.body;
    if (!client_id || !appointment_date || !Array.isArray(service_ids) || service_ids.length === 0) {
      return res.status(400).json({ message: 'Cliente, data e pelo menos um serviço são obrigatórios.' });
    }

    const existing = await getAppointmentById(appointmentId, req.user.tenant_id);
    if (!existing) {
      return res.status(404).json({ message: 'Agendamento não encontrado.' });
    }

    const client = await getClientById(client_id, req.user.tenant_id);
    if (!client) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }

    const services = await listServicesByIds(service_ids, req.user.tenant_id);
    if (services.length !== service_ids.length) {
      return res.status(400).json({ message: 'Um ou mais serviços não são válidos.' });
    }

    const total = services.reduce((sum, service) => sum + Number(service.price), 0);
    const appointment = await updateAppointment(appointmentId, req.user.tenant_id, client_id, appointment_date, total, payment_type || 'dinheiro', payment_status || 'a pagar', notes || '', services);
    res.json({ appointment });
  } catch (error) {
    next(error);
  }
}

async function deleteAppointmentHandler(req, res, next) {
  try {
    const appointmentId = Number(req.params.id);
    await deleteAppointment(appointmentId, req.user.tenant_id);
    res.json({ message: 'Agendamento removido.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listAppointments: listAppointmentsHandler, createAppointment: createAppointmentHandler, updateAppointment: updateAppointmentHandler, deleteAppointment: deleteAppointmentHandler };
