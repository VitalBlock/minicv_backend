const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const userCVRoutes = require('./userCVRoutes');
const adminRoutes = require('./adminRoutes');
const mercadoPagoRoutes = require('./mercadoPagoRoutes');
const jobSearchRoutes = require('./jobSearchRoutes');
const coverLetterRoutes = require('./coverLetterRoutes');
const interviewQuestionRoutes = require('./interviewQuestionRoutes');
const interviewSimulatorRoutes = require('./interviewSimulatorRoutes');
const healthController = require('../controllers/healthController');
const { requireAuth } = require('../middleware/auth');

// Rutas públicas
router.get('/health', healthController.checkHealth);
router.use('/auth', authRoutes);
router.use('/mercadopago', mercadoPagoRoutes); // Necesario para pagos

// Rutas protegidas - requieren autenticación
router.use('/user-cvs', requireAuth, userCVRoutes);
router.use('/admin', requireAuth, adminRoutes);
router.use('/job-search', requireAuth, jobSearchRoutes);
router.use('/cover-letters', requireAuth, coverLetterRoutes);
router.use('/interview-questions', requireAuth, interviewQuestionRoutes);
router.use('/interview-simulator', requireAuth, interviewSimulatorRoutes);

module.exports = router;