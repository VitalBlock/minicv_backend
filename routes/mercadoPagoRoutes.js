const express = require('express');
const { 
    createPreference,
    checkPayment,
    handleWebhook,
    getPublicKey,
    checkUserPayment,
    registerDownload
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

// Registrar una descarga
router.post('/register-download/:template', registerDownload);

module.exports = router;