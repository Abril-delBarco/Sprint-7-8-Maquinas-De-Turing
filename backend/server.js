require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// VALIDACION DE VARIABLES DE ENTORNO
if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error('Faltan variables de entorno: JWT_SECRET y/o MONGO_URI');
  process.exit(1);
}

const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// MIDDLEWARES GLOBALES
app.use(express.json());

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim());

app.use(cors({ origin: allowedOrigins, optionsSuccessStatus: 200 }));

// CONEXION A LA BASE DE DATOS
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('Conexion exitosa a la base de datos'))
  .catch((err) => {
    console.error('Error al conectar a la base de datos:', err.message);
    process.exit(1);
  });

// RUTAS
app.get('/', (req, res) => {
  res.send('API Muebleria Jota corriendo correctamente');
});

app.use('/api/auth', authRoutes);

try {
  const productRoutes = require('./routes/productRoutes');
  app.use('/api/productos', productRoutes);
} catch (error) {
  if (error.code !== 'MODULE_NOT_FOUND') throw error;
  console.log('Rutas de productos pendientes de integracion');
}

// MIDDLEWARES DE ERROR
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Ruta no encontrada' } });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: { message: err.message || 'Error interno del servidor' },
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});