const express = require('express');
const router = express.Router();
const mercadoPagoRoutes = require('./mercadoPagoRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const healthController = require('../controllers/healthController');

// Otras rutas
router.use('/mercadopago', mercadoPagoRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/auth', require('./authRoutes'));
router.use('/user-cvs', require('./userCVRoutes'));

module.exports = router;