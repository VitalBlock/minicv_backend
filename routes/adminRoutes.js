// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

// Todas las rutas requieren autenticación Y rol de admin
router.use(protect);
router.use(isAdmin);

// Rutas de administración
router.get('/users', adminController.getAllUsers);
router.get('/payments', adminController.getAllPayments);
router.get('/statistics', adminController.getStatistics);

module.exports = router;