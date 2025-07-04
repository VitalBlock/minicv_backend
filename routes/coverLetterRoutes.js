const express = require('express');
const router = express.Router();
const coverLetterController = require('../controllers/coverLetterController');
const { requireAuth } = require('../middleware/auth');
const premiumAccess = require('../middleware/premiumAccess');

// Rutas públicas
router.get('/templates', coverLetterController.getTemplates);

// Rutas protegidas (requieren autenticación)
router.post('/', requireAuth, coverLetterController.saveCoverLetter);
router.get('/', requireAuth, coverLetterController.getUserCoverLetters);
router.get('/:id', requireAuth, coverLetterController.getCoverLetterById);
router.put('/:id', requireAuth, coverLetterController.updateCoverLetter);
router.delete('/:id', requireAuth, coverLetterController.deleteCoverLetter);

// Rutas premium (requieren suscripción o ser admin)
router.post('/download', requireAuth, premiumAccess, coverLetterController.generatePDF);

module.exports = router;