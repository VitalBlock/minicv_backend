const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');
const { requireAuth } = require('../middleware/auth');
const premiumAccess = require('../middleware/premiumAccess');

// Rutas públicas para categorías y preguntas
router.get('/categories', interviewController.getCategories);
router.get('/subcategories/:category', interviewController.getSubcategories);
router.get('/:category', interviewController.getQuestionsByCategory);
router.get('/:category/:subcategory', interviewController.getQuestionsBySubcategory);

// Rutas que requieren autenticación
router.post('/view', requireAuth, interviewController.registerView);

// Rutas premium
router.get('/premium/all', requireAuth, premiumAccess, interviewController.getAllQuestions);

module.exports = router;