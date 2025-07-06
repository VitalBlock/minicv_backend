const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-token', authController.refreshToken);

// Rutas protegidas
router.get('/me', protect, authController.getCurrentUser);
router.get('/check-session', protect, authController.checkSession);
router.get('/subscription-status', protect, authController.checkSubscription);

module.exports = router;