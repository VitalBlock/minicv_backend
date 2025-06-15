// Cargar variables de entorno al inicio
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware CORS
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'https://www.mercadopago.com.ar'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Registrar todas las solicitudes para debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Ruta de verificación
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Backend funcionando correctamente' });
});

// Rutas API
app.use('/api', routes);

// Middleware de manejo de errores
app.use(errorHandler);

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Servidor backend ejecutándose en el puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

module.exports = app; // Para testing