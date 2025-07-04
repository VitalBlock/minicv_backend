const express = require('express');
const router = express.Router();
const interviewSimulatorController = require('../controllers/interviewSimulatorController');
const { protect } = require('../middleware/authMiddleware');

// Iniciar una entrevista (puede ser con o sin autenticación)
router.post('/start', interviewSimulatorController.startInterview);

// Enviar respuesta y obtener siguiente pregunta
router.post('/answer', interviewSimulatorController.answerAndGetNext);

// Obtener historial de entrevistas (requiere autenticación)
router.get('/history', protect, interviewSimulatorController.getInterviewHistory);

module.exports = router;