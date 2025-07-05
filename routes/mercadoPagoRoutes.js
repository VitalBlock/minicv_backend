const express = require('express');
const { 
    createPreference,
    checkPayment,
    handleWebhook,
    checkUserPayment,
    registerDownload,
    getPublicKey,
    checkUserPaymentGeneral,
    initializeSession
} = require('../controllers/mercadoPagoController');

const router = express.Router();

// Crear una preferencia de pago
router.post('/create-preference', createPreference);

// Verificar el estado de un pago
router.get('/check-payment/:id', checkPayment);

// Recibir notificaciones (webhook)
router.post('/webhook', handleWebhook);
router.get('/webhook', handleWebhook);

// Obtener la clave pública
router.get('/public-key', getPublicKey);

// Consultar el estado de un pago de usuario
router.get('/user-payment/:template', checkUserPayment);
router.get('/check-user-payment', checkUserPaymentGeneral);

// Registrar una descarga
router.post('/register-download/:template', registerDownload);
router.post('/initialize-session', initializeSession);

// Probar configuración de Mercado Pago
router.get('/test-config', (req, res) => {
  try {
    const config = {
      mercadoPagoConfigured: !!process.env.MERCADO_PAGO_ACCESS_TOKEN,
      frontendUrl: process.env.FRONTEND_URL,
      backendUrl: process.env.BACKEND_URL
    };
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;