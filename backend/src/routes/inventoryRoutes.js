const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listProductSales,
  sellProduct,
  deleteProductSale,
} = require('../controllers/inventoryController');

const router = express.Router();
router.use(authMiddleware, requireRole('user'));

router.get('/products', listProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/sales', listProductSales);
router.post('/products/:id/sell', sellProduct);
router.delete('/sales/:id', deleteProductSale);

module.exports = router;
