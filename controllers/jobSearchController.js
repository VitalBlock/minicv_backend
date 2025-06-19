const jobService = require('../services/jobSearchService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Base de datos simulada con ofertas de alta calidad (usada solo como respaldo)
const SIMULATED_JOBS = [
  // Mantén tus trabajos simulados aquí
];

/**
 * Buscar empleos usando APIs o datos simulados
 */
exports.searchJobs = async (req, res) => {
  try {
    const { q, location } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Se requiere un término de búsqueda' });
    }
    
    let jobs = [];
    let usedSimulatedData = false;
    
    // Intentar buscar en API real
    try {
      jobs = await jobService.searchJobs(q, location);
      logger.info(`Encontrados ${jobs.length} empleos en API externa`);
      
      // Si tenemos resultados reales, los devolvemos inmediatamente
      if (jobs.length > 0) {
        return res.status(200).json({ 
          jobs,
          source: 'remotive',
          count: jobs.length
        });
      }
    } catch (apiError) {
      logger.warn('Error al buscar en API externa, usando datos simulados', apiError);
      jobs = [];
    }
    
    // Si llegamos aquí, no hay resultados de la API, usamos datos simulados
    logger.info('Sin resultados de API real, usando datos simulados');
    usedSimulatedData = true;
    
    // Filtrar trabajos simulados según términos de búsqueda
    const searchTerms = q.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    const locationTerms = location ? location.toLowerCase().split(/\s+/).filter(term => term.length > 2) : [];
    
    const filteredSimulatedJobs = SIMULATED_JOBS.filter(job => {
      // Verificar coincidencia con términos de búsqueda
      const matchesSearch = searchTerms.some(term => 
        job.title.toLowerCase().includes(term) || 
        job.description.toLowerCase().includes(term) ||
        (job.skills && job.skills.some(skill => skill.includes(term)))
      );
      
      // Verificar coincidencia con ubicación (si se especificó)
      const matchesLocation = locationTerms.length === 0 || 
        locationTerms.some(term => job.location.toLowerCase().includes(term));
      
      return matchesSearch && matchesLocation;
    });
    
    return res.status(200).json({ 
      jobs: filteredSimulatedJobs.slice(0, 20), 
      source: 'simulated',
      count: filteredSimulatedJobs.length
    });
    
  } catch (error) {
    logger.error('Error en búsqueda de empleos', error);
    return res.status(500).json({ error: 'Error en búsqueda de empleos' });
  }
};