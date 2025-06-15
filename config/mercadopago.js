const mercadopago = require('mercadopago');
const dotenv = require('dotenv');

// Cargar variables de entorno primero
dotenv.config();

// Definir el token de acceso directamente como respaldo
const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || 'APP_USR-7192668342606025-061420-cd6839425a3d14fdbf408ff550e53473-1541849948';

// Verificar que tengamos un token válido
if (!accessToken) {
  console.error('ERROR: No se encontró MERCADO_PAGO_ACCESS_TOKEN');
  process.exit(1);
}

console.log('Configurando MercadoPago con token:', accessToken.substring(0, 10) + '...');

// Configurar MercadoPago con el token de acceso
mercadopago.configure({
  access_token: accessToken
});

module.exports = mercadopago;