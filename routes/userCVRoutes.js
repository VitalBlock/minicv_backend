const express = require('express');
const router = express.Router();
const userCVController = require('../controllers/userCVController');
const { protect } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas CRUD para CVs
router.post('/', userCVController.saveCV);
router.get('/', userCVController.getUserCVs);
router.get('/:id', userCVController.getCV);
router.put('/:id', userCVController.updateCV);
router.delete('/:id', userCVController.deleteCV);
router.put('/:id/apply-template', protect, userCVController.applyTemplate);

// Obtener CV por plantilla
router.get('/by-template/:template', protect, userCVController.getCVByTemplate);

module.exports = router;