const { getTenantById, updateTenant } = require('../models/tenantModel');

async function getTenantHandler(req, res, next) {
  try {
    const tenant = await getTenantById(req.user.tenant_id);
    if (!tenant) {
      return res.status(404).json({ message: 'Configurações não encontradas.' });
    }
    res.json({ tenant });
  } catch (error) {
    next(error);
  }
}

async function updateTenantHandler(req, res, next) {
  try {
    const { name, theme_color, logo_url } = req.body;
    const tenant = await updateTenant(req.user.tenant_id, { name, theme_color, logo_url });
    res.json({ tenant });
  } catch (error) {
    next(error);
  }
}

module.exports = { getTenant: getTenantHandler, updateTenant: updateTenantHandler };