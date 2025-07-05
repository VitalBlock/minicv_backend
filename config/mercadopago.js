const mercadopago = require('mercadopago');

// Usar el token de acceso configurado
const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || 'APP_USR-7192668342606025-061420-cd6839425a3d14fdbf408ff550e53473-1541849948';

// Verificar que tengamos un token válido
if (!accessToken) {
  console.error('ERROR: No se encontró MERCADO_PAGO_ACCESS_TOKEN');
  process.exit(1);
}

// Configurar con logs para depuración
console.log('Configurando MercadoPago...');
mercadopago.configure({
  access_token: accessToken
});

module.exports = mercadopago;