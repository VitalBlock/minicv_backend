require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'https://minicv.onrender.com',
  backendUrl: process.env.BACKEND_URL || 'https://minicv-backend.onrender.com',
  mercadoPago: {
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY
  },
  jwtSecret: process.env.JWT_SECRET || 'b07b4438af33c4a8ed2c9bcc',
  jwtExpiration: process.env.JWT_EXPIRATION || '1h',
};