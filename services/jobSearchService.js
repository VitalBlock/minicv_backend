const axios = require('axios');
const logger = require('../utils/logger');

// API gratuita de trabajos remotos
const REMOTIVE_API_URL = 'https://remotive.com/api/remote-jobs';

/**
 * Búsqueda de empleos usando Remotive API (sin autenticación requerida)
 */
exports.searchJobs = async (query, location) => {
  try {
    logger.info('Buscando empleos remotos', { query, location });
    
    // Realizar solicitud a la API
    const response = await axios.get(REMOTIVE_API_URL, {
      params: {
        search: query,
        limit: 20
      }
    });
    
    // Filtrar por ubicación si se proporciona
    let jobs = response.data.jobs;
    
    if (location && location.trim() !== '') {
      const locationLower = location.toLowerCase();
      jobs = jobs.filter(job => 
        job.candidate_required_location.toLowerCase().includes(locationLower)
      );
    }
    
    // Transformar a formato estándar
    return jobs.map(job => ({
      id: job.id.toString(),
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || 'Remoto',
      description: job.description.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 300) + '...',
      url: job.url,
      postedDate: job.publication_date.split('T')[0],
      salary: 'Consultar'
    }));
  } catch (error) {
    logger.error('Error en búsqueda de empleos', error);
    throw new Error(`Error en búsqueda de empleos: ${error.message}`);
  }
};