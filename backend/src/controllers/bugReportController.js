const { createBugReport, listUserBugReports } = require('../models/bugReportModel');

async function submitBugReport(req, res, next) {
  try {
    const { client_name, barbershop_name, description } = req.body;
    if (!client_name || !barbershop_name || !description) {
      return res.status(400).json({ message: 'Preencha nome do cliente, barbearia e descricao do problema.' });
    }

    const saved = await createBugReport(
      req.user.tenant_id,
      req.user.id,
      client_name.trim(),
      barbershop_name.trim(),
      description.trim()
    );

    res.status(201).json({ bugReport: saved });
  } catch (error) {
    next(error);
  }
}

async function getMyBugReports(req, res, next) {
  try {
    const reports = await listUserBugReports(req.user.tenant_id, req.user.id);
    res.json({ reports });
  } catch (error) {
    next(error);
  }
}

module.exports = { submitBugReport, getMyBugReports };
