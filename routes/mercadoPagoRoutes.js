const express = require('express');
const router = express.Router();
const mercadoPagoController = require('../controllers/mercadoPagoController');
const { protect } = require('../middleware/authMiddleware');
const { validatePreferenceData } = require('../middleware/validations');

// Crear una preferencia de pago
router.post('/create-preference', protect, validatePreferenceData, mercadoPagoController.createPreference);

// Verificar el estado de un pago
router.get('/check-payment/:id', mercadoPagoController.checkPayment);

// Recibir notificaciones (webhook)
router.post('/webhook', mercadoPagoController.handleWebhook);
router.get('/webhook', mercadoPagoController.handleWebhook);

// Obtener la clave pública
router.get('/public-key', mercadoPagoController.getPublicKey);

// Consultar el estado de un pago de usuario (ahora siempre es gratuito)
router.get('/user-payment/:template', mercadoPagoController.checkUserPayment);
router.get('/check-user-payment', mercadoPagoController.checkUserPaymentGeneral);
router.get('/check-user-payments', protect, mercadoPagoController.checkUserPayments);

// Registrar una descarga (ahora siempre es exitosa)
router.post('/register-download/:template', mercadoPagoController.registerDownload);
router.post('/initialize-session', mercadoPagoController.initializeSession);

// Crear una suscripción
router.post('/create-subscription', mercadoPagoController.createSubscriptionProxy);

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

// Nueva ruta para verificar autenticación (útil para debugging)
router.get('/check-auth', protect, (req, res) => {
  res.json({ 
    authenticated: true, 
    user: {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role
    }
  });
});

// Registrar un pago
router.post('/register-payment', protect, mercadoPagoController.registerPayment);

// Obtener plantillas premium del usuario
router.get('/user-premium-templates', protect, mercadoPagoController.getUserPremiumTemplates);

// Activar pagos pendientes
router.post('/activate-pending-payments', protect, mercadoPagoController.activatePendingPayments);

// Añadir esta ruta junto a las otras rutas
router.post('/create-test-payment', protect, mercadoPagoController.createTestPayment);

module.exports = router;