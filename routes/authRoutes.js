const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth'); // Asegúrate que la ruta sea correcta

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Rutas protegidas
router.get('/me', requireAuth, authController.getCurrentUser);
router.get('/subscription-status', requireAuth, authController.checkSubscription);
router.get('/check-session', requireAuth, authController.checkSession); // Ahora con requireAuth
router.post('/refresh-token', authController.refreshToken);

module.exports = router;