const db = require('../config/db');

function listProducts(tenantId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, name, quantity, unit_label, sale_price, cost_price, notes, created_at
       FROM inventory_products
       WHERE tenant_id = ?
       ORDER BY name`,
      [tenantId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

function getProductById(id, tenantId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id, tenant_id, name, quantity, unit_label, sale_price, cost_price, notes
       FROM inventory_products
       WHERE id = ? AND tenant_id = ?`,
      [id, tenantId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      }
    );
  });
}

function createProduct(tenantId, product) {
  return new Promise((resolve, reject) => {
    db.get(
      `INSERT INTO inventory_products (tenant_id, name, quantity, unit_label, sale_price, cost_price, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING id, name, quantity, unit_label, sale_price, cost_price, notes, created_at`,
      [tenantId, product.name, product.quantity, product.unit_label, product.sale_price, product.cost_price, product.notes],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
}

function updateProduct(id, tenantId, product) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE inventory_products
       SET name = ?, quantity = ?, unit_label = ?, sale_price = ?, cost_price = ?, notes = ?
       WHERE id = ? AND tenant_id = ?`,
      [product.name, product.quantity, product.unit_label, product.sale_price, product.cost_price, product.notes, id, tenantId],
      function (err) {
        if (err) return reject(err);
        getProductById(id, tenantId).then(resolve).catch(reject);
      }
    );
  });
}

function deleteProduct(id, tenantId) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM inventory_products WHERE id = ? AND tenant_id = ?', [id, tenantId], function (err) {
      if (err) reject(err);
      else resolve({ deleted: this.changes > 0 });
    });
  });
}

function listProductSales(tenantId) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, product_id, product_name, quantity, unit_label, sale_price, cost_price,
              gross_total, cost_total, profit_total, sold_at, created_at
       FROM product_sales
       WHERE tenant_id = ?
       ORDER BY sold_at DESC, created_at DESC`,
      [tenantId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

async function sellProduct(tenantId, productId, quantity, soldAt) {
  const product = await getProductById(productId, tenantId);
  if (!product) return null;
  if (Number(product.quantity) < quantity) {
    const error = new Error('Estoque insuficiente para esta venda.');
    error.status = 400;
    throw error;
  }

  const salePrice = Number(product.sale_price || 0);
  const costPrice = Number(product.cost_price || 0);
  const grossTotal = salePrice * quantity;
  const costTotal = costPrice * quantity;
  const profitTotal = grossTotal - costTotal;

  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE inventory_products SET quantity = quantity - ? WHERE id = ? AND tenant_id = ?',
      [quantity, productId, tenantId],
      (updateErr) => {
        if (updateErr) return reject(updateErr);
        db.get(
          `INSERT INTO product_sales (
             tenant_id, product_id, product_name, quantity, unit_label, sale_price, cost_price,
             gross_total, cost_total, profit_total, sold_at
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           RETURNING id, product_id, product_name, quantity, unit_label, sale_price, cost_price,
                     gross_total, cost_total, profit_total, sold_at, created_at`,
          [tenantId, productId, product.name, quantity, product.unit_label, salePrice, costPrice, grossTotal, costTotal, profitTotal, soldAt],
          (insertErr, row) => {
            if (insertErr) reject(insertErr);
            else resolve(row);
          }
        );
      }
    );
  });
}

function deleteProductSale(id, tenantId) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, product_id, quantity FROM product_sales WHERE id = ? AND tenant_id = ?', [id, tenantId], (findErr, sale) => {
      if (findErr) return reject(findErr);
      if (!sale) return resolve({ deleted: false });
      db.run('DELETE FROM product_sales WHERE id = ? AND tenant_id = ?', [id, tenantId], function (deleteErr) {
        if (deleteErr) return reject(deleteErr);
        if (!sale.product_id) return resolve({ deleted: this.changes > 0 });
        db.run(
          'UPDATE inventory_products SET quantity = quantity + ? WHERE id = ? AND tenant_id = ?',
          [sale.quantity, sale.product_id, tenantId],
          (restoreErr) => {
            if (restoreErr) reject(restoreErr);
            else resolve({ deleted: true });
          }
        );
      });
    });
  });
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  listProductSales,
  sellProduct,
  deleteProductSale,
};
