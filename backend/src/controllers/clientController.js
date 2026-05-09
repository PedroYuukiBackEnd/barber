const { listClients, createClient, updateClient, deleteClient, getClientById } = require('../models/clientModel');

async function listClientsHandler(req, res, next) {
  try {
    const clients = await listClients(req.user.tenant_id);
    res.json({ clients });
  } catch (error) {
    next(error);
  }
}

async function createClientHandler(req, res, next) {
  try {
    const { name, phone, notes } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'O nome do cliente é obrigatório.' });
    }
    const client = await createClient(req.user.tenant_id, name, phone || '', notes || '');
    res.status(201).json({ client });
  } catch (error) {
    next(error);
  }
}

async function updateClientHandler(req, res, next) {
  try {
    const clientId = Number(req.params.id);
    const { name, phone, notes } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'O nome do cliente é obrigatório.' });
    }
    const client = await getClientById(clientId, req.user.tenant_id);
    if (!client) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }
    const updated = await updateClient(clientId, req.user.tenant_id, name, phone || '', notes || '');
    res.json({ client: updated });
  } catch (error) {
    next(error);
  }
}

async function deleteClientHandler(req, res, next) {
  try {
    const clientId = Number(req.params.id);
    await deleteClient(clientId, req.user.tenant_id);
    res.json({ message: 'Cliente removido.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { listClients: listClientsHandler, createClient: createClientHandler, updateClient: updateClientHandler, deleteClient: deleteClientHandler };
