const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, requireAuth } = require('../middleware/authMiddleware');

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Rutas protegidas
router.get('/me', protect, authController.getCurrentUser);
router.get('/subscription-status', protect, authController.checkSubscription);
router.get('/check-session', requireAuth, authController.checkSession);

// Rutas protegidas para gestión del perfil
router.put('/update-profile', protect, authController.updateProfile);
router.put('/change-password', protect, authController.changePassword);
router.delete('/delete-account', protect, authController.deleteAccount);

module.exports = router;