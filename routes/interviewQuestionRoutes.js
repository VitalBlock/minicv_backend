const express = require('express');
const router = express.Router();
const interviewQuestionController = require('../controllers/interviewQuestionController');
const { protect } = require('../middleware/authMiddleware');

// Obtener categorías (público)
router.get('/categories', interviewQuestionController.getCategories);

// Obtener preguntas por categoría (requiere autenticación)
router.get('/category/:categoryId', protect, interviewQuestionController.getQuestionsByCategory);

// Obtener preguntas por subcategoría (requiere autenticación)
router.get('/category/:categoryId/subcategory/:subcategoryId', protect, interviewQuestionController.getQuestionsBySubcategory);

// Registrar uso de preguntas (requiere autenticación)
router.post('/usage', protect, interviewQuestionController.registerUsage);

module.exports = router;