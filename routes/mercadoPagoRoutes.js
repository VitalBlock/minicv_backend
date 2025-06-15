const express = require('express');
const { 
    createPreference,
    checkPayment,
    handleWebhook,
    getPublicKey
} = require('../controllers/mercadoPagoController');
const { validatePreferenceData } = require('../middleware/validations');

const router = express.Router();

// Crear una preferencia de pago
router.post('/create-preference', validatePreferenceData, createPreference);

// Verificar el estado de un pago
router.get('/check-payment/:paymentId', checkPayment);

// Recibir notificaciones (webhook)
router.post('/webhook', handleWebhook);

// Obtener la clave pública
router.get('/public-key', getPublicKey);

module.exports = router;