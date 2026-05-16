const {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  listProductSales,
  sellProduct,
  deleteProductSale,
} = require('../models/inventoryModel');

function normalizeProduct(body) {
  return {
    name: String(body.name || '').trim(),
    quantity: Math.max(0, Number(body.quantity || 0)),
    unit_label: String(body.unit_label || 'un.').trim() || 'un.',
    sale_price: Math.max(0, Number(body.sale_price || 0)),
    cost_price: Math.max(0, Number(body.cost_price || 0)),
    notes: String(body.notes || '').trim(),
  };
}

function normalizeDate(value) {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return new Date().toISOString().slice(0, 10);
}

async function listProductsHandler(req, res, next) {
  try {
    const products = await listProducts(req.user.tenant_id);
    res.json({ products });
  } catch (error) {
    next(error);
  }
}

async function createProductHandler(req, res, next) {
  try {
    const productPayload = normalizeProduct(req.body);
    if (!productPayload.name) return res.status(400).json({ message: 'Informe o nome do produto.' });
    const product = await createProduct(req.user.tenant_id, productPayload);
    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
}

async function updateProductHandler(req, res, next) {
  try {
    const id = Number(req.params.id);
    const existing = await getProductById(id, req.user.tenant_id);
    if (!existing) return res.status(404).json({ message: 'Produto nao encontrado.' });
    const productPayload = normalizeProduct(req.body);
    if (!productPayload.name) return res.status(400).json({ message: 'Informe o nome do produto.' });
    const product = await updateProduct(id, req.user.tenant_id, productPayload);
    res.json({ product });
  } catch (error) {
    next(error);
  }
}

async function deleteProductHandler(req, res, next) {
  try {
    const result = await deleteProduct(Number(req.params.id), req.user.tenant_id);
    if (!result.deleted) return res.status(404).json({ message: 'Produto nao encontrado.' });
    res.json({ message: 'Produto removido.' });
  } catch (error) {
    next(error);
  }
}

async function listProductSalesHandler(req, res, next) {
  try {
    const sales = await listProductSales(req.user.tenant_id);
    res.json({ sales });
  } catch (error) {
    next(error);
  }
}

async function sellProductHandler(req, res, next) {
  try {
    const productId = Number(req.params.id);
    const quantity = Number(req.body.quantity || 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ message: 'Informe uma quantidade maior que zero.' });
    }
    const sale = await sellProduct(req.user.tenant_id, productId, quantity, normalizeDate(req.body.sold_at));
    if (!sale) return res.status(404).json({ message: 'Produto nao encontrado.' });
    res.status(201).json({ sale });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    next(error);
  }
}

async function deleteProductSaleHandler(req, res, next) {
  try {
    const result = await deleteProductSale(Number(req.params.id), req.user.tenant_id);
    if (!result.deleted) return res.status(404).json({ message: 'Venda nao encontrada.' });
    res.json({ message: 'Venda removida e estoque restaurado.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listProducts: listProductsHandler,
  createProduct: createProductHandler,
  updateProduct: updateProductHandler,
  deleteProduct: deleteProductHandler,
  listProductSales: listProductSalesHandler,
  sellProduct: sellProductHandler,
  deleteProductSale: deleteProductSaleHandler,
};
