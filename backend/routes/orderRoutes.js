
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { createOrder, getMyOrders } = require('../controllers/orderController');

router.post('/', protect, createOrder);
router.get('/mis-pedidos', protect, getMyOrders);

module.exports = router;
