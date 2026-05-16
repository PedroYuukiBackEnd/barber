const { listManualEarnings, createManualEarning, deleteManualEarning } = require('../models/earningModel');

function normalizeEntryDate(value) {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return new Date().toISOString().slice(0, 10);
}

async function listManualEarningsHandler(req, res, next) {
  try {
    const earnings = await listManualEarnings(req.user.tenant_id);
    res.json({ earnings });
  } catch (error) {
    next(error);
  }
}

async function createManualEarningHandler(req, res, next) {
  try {
    const amount = Number(req.body.amount);
    const description = String(req.body.description || '').trim();
    const entryDate = normalizeEntryDate(req.body.entry_date);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Informe um valor maior que zero.' });
    }

    const earning = await createManualEarning(req.user.tenant_id, amount, description, entryDate);
    res.status(201).json({ earning });
  } catch (error) {
    next(error);
  }
}

async function deleteManualEarningHandler(req, res, next) {
  try {
    const result = await deleteManualEarning(Number(req.params.id), req.user.tenant_id);
    if (!result.deleted) {
      return res.status(404).json({ message: 'Ganho manual nao encontrado.' });
    }
    res.json({ message: 'Ganho manual removido.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listManualEarnings: listManualEarningsHandler,
  createManualEarning: createManualEarningHandler,
  deleteManualEarning: deleteManualEarningHandler,
};
