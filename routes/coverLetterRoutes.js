const express = require('express');
const router = express.Router();
const coverLetterController = require('../controllers/coverLetterController');
const { protect } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas CRUD para cartas de presentación
router.post('/', coverLetterController.saveCoverLetter);
router.get('/', coverLetterController.getUserCoverLetters);
router.get('/:id', coverLetterController.getCoverLetter);
router.put('/:id', coverLetterController.updateCoverLetter);
router.delete('/:id', coverLetterController.deleteCoverLetter);

module.exports = router;