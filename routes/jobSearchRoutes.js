const express = require('express');
const router = express.Router();
const jobSearchController = require('../controllers/jobSearchController');

// Ruta para buscar empleos
router.get('/search', jobSearchController.searchJobs);

module.exports = router;