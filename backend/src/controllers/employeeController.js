const { listEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee } = require('../models/employeeModel');

const ALLOWED_GENDERS = ['', 'feminino', 'masculino'];

function normalizeGender(value) {
  const gender = String(value || '').trim().toLowerCase();
  return ALLOWED_GENDERS.includes(gender) ? gender : '';
}

async function listEmployeesHandler(req, res, next) {
  try {
    const employees = await listEmployees(req.user.tenant_id);
    res.json({ employees });
  } catch (error) {
    next(error);
  }
}

async function createEmployeeHandler(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();
    const notes = String(req.body.notes || '').trim();
    const gender = normalizeGender(req.body.gender);
    const specialty = String(req.body.specialty || '').trim();
    const monthlyGoal = Math.max(0, Number(req.body.monthly_goal || 0));
    if (!name) return res.status(400).json({ message: 'O nome do funcionario e obrigatorio.' });

    const employee = await createEmployee(req.user.tenant_id, name, phone, notes, gender, specialty, monthlyGoal);
    res.status(201).json({ employee });
  } catch (error) {
    next(error);
  }
}

async function updateEmployeeHandler(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await getEmployeeById(id, req.user.tenant_id);
    if (!existing) return res.status(404).json({ message: 'Funcionario nao encontrado.' });

    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();
    const notes = String(req.body.notes || '').trim();
    const gender = normalizeGender(req.body.gender);
    const specialty = String(req.body.specialty || '').trim();
    const monthlyGoal = Math.max(0, Number(req.body.monthly_goal || 0));
    if (!name) return res.status(400).json({ message: 'O nome do funcionario e obrigatorio.' });

    const employee = await updateEmployee(id, req.user.tenant_id, name, phone, notes, gender, specialty, monthlyGoal);
    res.json({ employee });
  } catch (error) {
    next(error);
  }
}

async function deleteEmployeeHandler(req, res, next) {
  try {
    const result = await deleteEmployee(Number(req.params.id), req.user.tenant_id);
    if (!result.deleted) return res.status(404).json({ message: 'Funcionario nao encontrado.' });
    res.json({ message: 'Funcionario removido.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listEmployees: listEmployeesHandler,
  createEmployee: createEmployeeHandler,
  updateEmployee: updateEmployeeHandler,
  deleteEmployee: deleteEmployeeHandler,
};
