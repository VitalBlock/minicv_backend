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
      logger.error('Error al buscar en API externa:', apiError);
      // En caso de error, continuamos con datos simulados
    }
    
    // Si llegamos aquí, usamos datos simulados
    logger.info('Usando datos simulados para búsqueda de empleo');
    
    // Filtrar trabajos simulados según términos de búsqueda
    const searchTerms = q.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    const locationTerms = location ? location.toLowerCase().split(/\s+/).filter(term => term.length > 2) : [];
    
    // Asegurarnos de que SIMULATED_JOBS exista y tenga datos
    const simulatedJobs = Array.isArray(SIMULATED_JOBS) && SIMULATED_JOBS.length > 0 
      ? SIMULATED_JOBS 
      : [
          {
            id: "sim1",
            title: "Desarrollador Frontend",
            company: "TechCorp",
            location: location || "Remoto",
            description: "Buscamos desarrollador frontend con experiencia en React y CSS moderno.",
            url: "https://ejemplo.com/trabajo/1",
            postedDate: new Date().toISOString().split('T')[0],
            salary: "Competitivo"
          },
          {
            id: "sim2",
            title: "Diseñador UX/UI",
            company: "CreativeAgency",
            location: location || "Remoto",
            description: "Posición para diseñador UX/UI con experiencia en Figma y diseño de interfaces.",
            url: "https://ejemplo.com/trabajo/2",
            postedDate: new Date().toISOString().split('T')[0],
            salary: "Según experiencia"
          }
        ];
    
    const filteredJobs = simulatedJobs.filter(job => {
      // Verificar coincidencia con términos de búsqueda
      const matchesSearch = searchTerms.some(term => 
        job.title.toLowerCase().includes(term) || 
        job.description.toLowerCase().includes(term)
      );
      
      // Verificar coincidencia con ubicación (si se especificó)
      const matchesLocation = locationTerms.length === 0 || 
        locationTerms.some(term => job.location.toLowerCase().includes(term));
      
      return matchesSearch && matchesLocation;
    });
    
    return res.status(200).json({ 
      jobs: filteredJobs, 
      source: 'simulated',
      count: filteredJobs.length
    });
    
  } catch (error) {
    logger.error('Error general en búsqueda de empleos:', error);
    return res.status(500).json({ error: 'Error en búsqueda de empleos' });
  }
};