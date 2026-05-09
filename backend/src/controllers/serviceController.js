const { listServices, createService, updateService, deleteService, getServiceById } = require('../models/serviceModel');

async function listServicesHandler(req, res, next) {
  try {
    const services = await listServices(req.user.tenant_id);
    res.json({ services });
  } catch (error) {
    next(error);
  }
}

async function createServiceHandler(req, res, next) {
  try {
    const { name, price, description } = req.body;
    if (!name || price === undefined || Number(price) < 0) {
      return res.status(400).json({ message: 'Nome e preço válidos são obrigatórios.' });
    }
    const service = await createService(req.user.tenant_id, name, Number(price), description || '');
    res.status(201).json({ service });
  } catch (error) {
    next(error);
  }
}

async function updateServiceHandler(req, res, next) {
  try {
    const serviceId = Number(req.params.id);
    const { name, price, description } = req.body;
    if (!name || price === undefined || Number(price) < 0) {
      return res.status(400).json({ message: 'Nome e preço válidos são obrigatórios.' });
    }
    const existing = await getServiceById(serviceId, req.user.tenant_id);
    if (!existing) {
      return res.status(404).json({ message: 'Serviço não encontrado.' });
    }
    const service = await updateService(serviceId, req.user.tenant_id, name, Number(price), description || '');
    res.json({ service });
  } catch (error) {
    next(error);
  }
}

async function deleteServiceHandler(req, res, next) {
  try {
    const serviceId = Number(req.params.id);
    await deleteService(serviceId, req.user.tenant_id);
    res.json({ message: 'Serviço removido.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listServices: listServicesHandler, createService: createServiceHandler, updateService: updateServiceHandler, deleteService: deleteServiceHandler };
