require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4242,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:4242',
  mercadoPago: {
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY
  },
  nodeEnv: process.env.NODE_ENV || 'development'
};