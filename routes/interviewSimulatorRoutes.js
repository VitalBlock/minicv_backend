const express = require('express');
const router = express.Router();
const simulatorController = require('../controllers/simulatorController');
const { requireAuth } = require('../middleware/auth');
const premiumAccess = require('../middleware/premiumAccess');

// Rutas básicas (1 sesión gratuita)
router.post('/start', requireAuth, simulatorController.startSession);
router.post('/question', requireAuth, simulatorController.generateQuestion);
router.post('/analyze', requireAuth, simulatorController.analyzeResponse);

// Rutas premium (análisis avanzado, feedback detallado)
router.post('/feedback', requireAuth, premiumAccess, simulatorController.generateFeedback);
router.post('/advanced-analysis', requireAuth, premiumAccess, simulatorController.advancedAnalysis);

module.exports = router;