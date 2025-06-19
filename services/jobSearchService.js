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
        limit: 30 // Aumentamos el límite para tener más resultados
      },
      timeout: 15000 // Timeout aumentado para dar tiempo a la API
    });
    
    if (!response.data || !response.data.jobs) {
      logger.warn('Respuesta de API Remotive sin datos de trabajos');
      return [];
    }
    
    logger.info(`Remotive API devolvió ${response.data.jobs.length} resultados`);
    
    // Filtrar por ubicación si se proporciona
    let jobs = response.data.jobs;
    
    if (location && location.trim() !== '') {
      const locationLower = location.toLowerCase();
      const filteredJobs = jobs.filter(job => 
        job.candidate_required_location && 
        job.candidate_required_location.toLowerCase().includes(locationLower)
      );
      
      // Solo usar filtrado si devuelve resultados, sino mantener los originales
      if (filteredJobs.length > 0) {
        logger.info(`Filtrado por ubicación: ${filteredJobs.length} resultados`);
        jobs = filteredJobs;
      } else {
        logger.info(`Filtrado por ubicación sin resultados, mostrando todos los empleos`);
      }
    }
    
    // Transformar a formato estándar
    return jobs.map(job => ({
      id: job.id.toString(),
      title: job.title || 'Título no disponible',
      company: job.company_name || 'Empresa no especificada',
      location: job.candidate_required_location || 'Remoto',
      description: job.description 
        ? job.description.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 300) + '...'
        : 'Descripción no disponible',
      url: job.url || '',
      postedDate: job.publication_date ? job.publication_date.split('T')[0] : new Date().toISOString().split('T')[0],
      salary: job.salary || 'Consultar'
    }));
  } catch (error) {
    logger.error('Error en búsqueda de empleos', error);
    throw new Error(`Error en búsqueda de empleos: ${error.message}`);
  }
};