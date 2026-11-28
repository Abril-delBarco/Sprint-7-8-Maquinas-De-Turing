const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const registerUser = async (req, res) => {
  try {
    const { nombre, email, password } = req.body; 

    if (
      typeof nombre !== 'string' || typeof email !== 'string' || typeof password !== 'string' ||
      !nombre.trim() || !email.trim() || !password
    ) {
      return res.status(400).json({ message: 'Completa nombre, email y contraseña' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const emailNormalizado = email.toLowerCase().trim();
    const existeUsuario = await User.findOne({ email: emailNormalizado });
    if (existeUsuario) {
      return res.status(400).json({ message: 'Ya existe un usuario con ese email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      nombre: nombre.trim(),
      email: emailNormalizado,
      password: hashedPassword,
    });

    const token = generarToken(user._id);
    return res.status(201).json({
      token,
      user: { _id: user._id, nombre: user.nombre, email: user.email, rol: user.rol },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ya existe un usuario con ese email' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Error en registro:', error);
    return res.status(500).json({ message: 'Error al registrar usuario' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Ingresa email y contraseña' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const passwordValida = await bcrypt.compare(password, user.password);
    if (!passwordValida) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const token = generarToken(user._id);

    return res.json({
      token,
      user: {
        _id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error al iniciar sesión' });
  }
};

module.exports = { registerUser, loginUser };