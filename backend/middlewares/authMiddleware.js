// backend/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ message: 'No autorizado: falta el token (Authorization: Bearer <token>)' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.id || decoded._id || decoded.userId;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'No autorizado: el usuario ya no existe' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'No autorizado: el token expiró' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'No autorizado: token inválido' });
    }
    console.error('Error en authMiddleware:', error);
    return res.status(500).json({ message: 'Error interno de autenticación' });
  }
};

module.exports = { protect };