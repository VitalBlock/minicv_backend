const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');

// Ruta para registrar eventos de conversión
router.post('/track', async (req, res) => {
  try {
    const eventData = req.body;
    const result = await analyticsService.trackEvent(eventData);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ruta para obtener estadísticas
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await analyticsService.getConversionStats(startDate, endDate);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;