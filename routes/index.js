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
router.use('/admin', require('./adminRoutes'));

// Asegúrate de tener esta sección en tu archivo de rutas principal
const jobSearchRoutes = require('./jobSearchRoutes');

// Añadir la ruta de búsqueda de empleos
router.use('/jobs', jobSearchRoutes);

// Añadir nuevas rutas
router.use('/cover-letters', require('./coverLetterRoutes'));
router.use('/interview-questions', require('./interviewQuestionRoutes'));
router.use('/interview-simulator', require('./interviewSimulatorRoutes'));

module.exports = router;