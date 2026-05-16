const {
  listAppointments,
  createAppointment,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  finishAppointment,
  listServiceHistory,
  deleteServiceHistory,
} = require('../models/appointmentModel');
const { getClientById } = require('../models/clientModel');
const { getEmployeeById } = require('../models/employeeModel');
const { listServicesByIds } = require('../models/serviceModel');
const { getTenantById } = require('../models/tenantModel');
const { normalizeAttachment } = require('../utils/attachment');

function normalizePaymentProof(paymentStatus, paymentProofName, paymentProofData) {
  if (paymentStatus !== 'ja pago') {
    return { proofName: '', proofData: '' };
  }

  const { attachmentName, attachmentData } = normalizeAttachment(paymentProofName, paymentProofData, {
    fallbackName: 'comprovante',
  });
  return { proofName: attachmentName, proofData: attachmentData };
}

async function validateEmployee(employeeId, tenantId) {
  if (!employeeId) return null;
  const employee = await getEmployeeById(Number(employeeId), tenantId);
  if (!employee) {
    const error = new Error('Funcionario nao encontrado.');
    error.status = 404;
    throw error;
  }
  return employee;
}

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
    const { client_id, employee_id, appointment_date, service_ids, payment_type, payment_status, payment_proof_name, payment_proof_data, note_attachment_name, note_attachment_data, alarm_enabled, notes } = req.body;
    if (!client_id || !appointment_date || !Array.isArray(service_ids) || service_ids.length === 0) {
      return res.status(400).json({ message: 'Cliente, data e pelo menos um servico sao obrigatorios.' });
    }

    const client = await getClientById(client_id, req.user.tenant_id);
    if (!client) return res.status(404).json({ message: 'Cliente nao encontrado.' });
    await validateEmployee(employee_id, req.user.tenant_id);

    const services = await listServicesByIds(service_ids, req.user.tenant_id);
    if (services.length !== service_ids.length) {
      return res.status(400).json({ message: 'Um ou mais servicos nao sao validos.' });
    }

    const total = services.reduce((sum, service) => sum + Number(service.price), 0);
    const { proofName, proofData } = normalizePaymentProof(payment_status, payment_proof_name, payment_proof_data);
    const { attachmentName, attachmentData } = normalizeAttachment(note_attachment_name, note_attachment_data, {
      fallbackName: 'anexo-agendamento',
    });
    const appointment = await createAppointment(req.user.tenant_id, client_id, Number(employee_id) || null, appointment_date, total, payment_type || 'dinheiro', payment_status || 'a pagar', proofName, proofData, attachmentName, attachmentData, Boolean(alarm_enabled), notes || '', services);
    res.status(201).json({ appointment });
  } catch (error) {
    next(error);
  }
}

async function updateAppointmentHandler(req, res, next) {
  try {
    const appointmentId = Number(req.params.id);
    const { client_id, employee_id, appointment_date, service_ids, payment_type, payment_status, payment_proof_name, payment_proof_data, note_attachment_name, note_attachment_data, alarm_enabled, notes } = req.body;
    if (!client_id || !appointment_date || !Array.isArray(service_ids) || service_ids.length === 0) {
      return res.status(400).json({ message: 'Cliente, data e pelo menos um servico sao obrigatorios.' });
    }

    const existing = await getAppointmentById(appointmentId, req.user.tenant_id);
    if (!existing) return res.status(404).json({ message: 'Agendamento nao encontrado.' });

    const client = await getClientById(client_id, req.user.tenant_id);
    if (!client) return res.status(404).json({ message: 'Cliente nao encontrado.' });
    await validateEmployee(employee_id, req.user.tenant_id);

    const services = await listServicesByIds(service_ids, req.user.tenant_id);
    if (services.length !== service_ids.length) {
      return res.status(400).json({ message: 'Um ou mais servicos nao sao validos.' });
    }

    const total = services.reduce((sum, service) => sum + Number(service.price), 0);
    const { proofName, proofData } = normalizePaymentProof(payment_status, payment_proof_name, payment_proof_data);
    const { attachmentName, attachmentData } = normalizeAttachment(note_attachment_name, note_attachment_data, {
      fallbackName: 'anexo-agendamento',
    });
    const appointment = await updateAppointment(appointmentId, req.user.tenant_id, client_id, Number(employee_id) || null, appointment_date, total, payment_type || 'dinheiro', payment_status || 'a pagar', proofName, proofData, attachmentName, attachmentData, Boolean(alarm_enabled), notes || '', services);
    res.json({ appointment });
  } catch (error) {
    next(error);
  }
}

async function deleteAppointmentHandler(req, res, next) {
  try {
    await deleteAppointment(Number(req.params.id), req.user.tenant_id);
    res.json({ message: 'Agendamento removido.' });
  } catch (error) {
    next(error);
  }
}

async function finishAppointmentHandler(req, res, next) {
  try {
    const appointmentId = Number(req.params.id);
    const existing = await getAppointmentById(appointmentId, req.user.tenant_id);
    if (!existing) return res.status(404).json({ message: 'Agendamento nao encontrado.' });

    const tenant = await getTenantById(req.user.tenant_id);
    const requirePixProof = Boolean(tenant?.require_pix_proof_to_finish);
    if (requirePixProof && existing.payment_type === 'pix' && (existing.payment_status !== 'ja pago' || !existing.payment_proof_data)) {
      return res.status(400).json({ message: 'Para finalizar trabalho pago via PIX, marque como ja pago e anexe o comprovante no agendamento.' });
    }
    const history = await finishAppointment(appointmentId, req.user.tenant_id);
    if (!history) return res.status(404).json({ message: 'Agendamento nao encontrado.' });

    res.status(201).json({ history });
  } catch (error) {
    next(error);
  }
}

async function listServiceHistoryHandler(req, res, next) {
  try {
    const history = await listServiceHistory(req.user.tenant_id);
    res.json({ history });
  } catch (error) {
    next(error);
  }
}

async function deleteServiceHistoryHandler(req, res, next) {
  try {
    const result = await deleteServiceHistory(Number(req.params.id), req.user.tenant_id);
    if (!result.deleted) return res.status(404).json({ message: 'Historico nao encontrado.' });
    res.json({ message: 'Historico removido.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listAppointments: listAppointmentsHandler,
  createAppointment: createAppointmentHandler,
  updateAppointment: updateAppointmentHandler,
  deleteAppointment: deleteAppointmentHandler,
  finishAppointment: finishAppointmentHandler,
  listServiceHistory: listServiceHistoryHandler,
  deleteServiceHistory: deleteServiceHistoryHandler,
};
