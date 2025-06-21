// Cargar variables de entorno al inicio
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');
const { sequelize, initializeDatabase } = require('./config/database');

const app = express();

const allowedOrigins = [
  'https://minicv.univerdad.me',     // Tu dominio personalizado
  'http://localhost:3000',  // Para desarrollo local
  'https://minicv-frontend.vercel.app', // Dominio de Vercel    
  'https://www.mercadopago.com.ar',  // Para webhooks de MercadoPago
  'https://www.mercadopago.com.co'   // Para webhooks de MercadoPago Colombia
];

// Middleware CORS
app.use(cors({
  origin: function(origin, callback) {
    // Permitir solicitudes sin origen (como aplicaciones móviles o herramientas de API)
    if (!origin) return callback(null, true);
    
    // Usar una comparación más flexible para dominios
    if (allowedOrigins.some(allowedOrigin => 
      origin === allowedOrigin || origin.startsWith(allowedOrigin)
    )) {
      return callback(null, true);
    }
    
    console.log('Origen rechazado por CORS:', origin);
    callback(null, true); // Temporalmente permitir todos los orígenes para debugging
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

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

// Sincronizar modelos con la base de datos
(async () => {
  try {
    await initializeDatabase({ 
      sync: true, 
      syncOptions: { alter: true } 
    });
    console.log('Modelos sincronizados con la base de datos');
  } catch (error) {
    console.error('Error al sincronizar modelos:', error);
  }
})();

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`Servidor backend ejecutándose en el puerto ${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Validar variables de entorno requeridas
const requiredEnvVars = [
  'MERCADO_PAGO_ACCESS_TOKEN',
  'MERCADO_PAGO_PUBLIC_KEY',
  'JWT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('Variables de entorno faltantes:', missingVars.join(', '));
  console.error('Por favor configura estas variables en el archivo .env o en las variables de entorno');
  
  // En desarrollo, terminar el proceso
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
}

module.exports = app;