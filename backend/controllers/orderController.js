
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

const createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'El pedido debe incluir al menos un producto' });
    }

    const orderItems = [];
    let total = 0;

    for (const item of items) {
      const productId = item.product || item.productId;
      const quantity = Number(item.quantity);

      if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({ message: 'Producto o cantidad inválidos' });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: `Producto no encontrado: ${productId}` });
      }

      orderItems.push({
        product: product._id,
        name: product.name || product.nombre,
        price: product.price ?? product.precio,
        quantity,
      });
      total += (product.price ?? product.precio) * quantity;
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      total,
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error('Error al crear pedido:', error);
    return res.status(500).json({ message: 'Error al crear el pedido' });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    return res.status(500).json({ message: 'Error al obtener los pedidos' });
  }
};

module.exports = { createOrder, getMyOrders };