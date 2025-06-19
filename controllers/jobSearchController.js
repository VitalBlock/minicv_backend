const jobService = require('../services/jobSearchService');
const logger = require('../utils/logger');

// Base de datos simulada con ofertas de alta calidad
const SIMULATED_JOBS = [
  {
    id: "sim1",
    title: "Desarrollador Frontend Senior",
    company: "TechCorp Global",
    location: "Bogotá, Colombia",
    salary: "$4.500.000 - $6.500.000 COP",
    description: "Buscamos un desarrollador frontend experimentado para liderar proyectos utilizando React y TypeScript. Deberás optimizar el rendimiento de aplicaciones web complejas y colaborar con equipos multidisciplinarios para crear experiencias de usuario excepcionales.",
    skills: ["react", "typescript", "redux", "graphql", "optimización"],
    postedDate: "2023-12-01",
    url: "https://ejemplo.com/trabajo/1"
  },
  // ... más trabajos simulados de alta calidad
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
    
    // Intentar buscar en API real
    try {
      jobs = await jobService.searchJobs(q, location);
      logger.info(`Encontrados ${jobs.length} empleos en API externa`);
    } catch (apiError) {
      logger.warn('Error al buscar en API externa, usando datos simulados', apiError);
      // Si falla la API, usamos datos simulados
      jobs = [];
    }
    
    // Si no hay resultados o hay pocos, complementar con datos simulados
    if (jobs.length < 5) {
      logger.info('Complementando con datos simulados');
      
      // Filtrar trabajos simulados según términos de búsqueda
      const searchTerms = q.toLowerCase().split(/\s+/);
      const locationTerms = location ? location.toLowerCase().split(/\s+/) : [];
      
      const filteredSimulatedJobs = SIMULATED_JOBS.filter(job => {
        // Verificar coincidencia con términos de búsqueda
        const matchesSearch = searchTerms.some(term => 
          job.title.toLowerCase().includes(term) || 
          job.description.toLowerCase().includes(term) ||
          job.skills.some(skill => skill.includes(term))
        );
        
        // Verificar coincidencia con ubicación
        const matchesLocation = !location || locationTerms.some(term => 
          job.location.toLowerCase().includes(term)
        );
        
        return matchesSearch && matchesLocation;
      });
      
      // Combinar resultados reales con simulados
      jobs = [...jobs, ...filteredSimulatedJobs]
        // Eliminar posibles duplicados
        .filter((job, index, self) => 
          index === self.findIndex(j => j.id === job.id)
        )
        // Limitar a 20 resultados
        .slice(0, 20);
    }
    
    return res.status(200).json({ jobs });
  } catch (error) {
    logger.error('Error en búsqueda de empleos', error);
    return res.status(500).json({ error: 'Error en búsqueda de empleos' });
  }
};