require('dotenv').config();
const { initializeDatabase } = require('../config/database');
const seedInterviewData = require('./seedInterviewData');
const logger = require('../utils/logger');

async function initialize() {
  try {
    // Inicializar base de datos
    logger.info('Inicializando base de datos...');
    await initializeDatabase({ 
      sync: true, 
      syncOptions: { alter: true } 
    });
    
    // Sembrar datos iniciales
    logger.info('Sembrando datos iniciales...');
    await seedInterviewData();
    
    logger.info('Inicialización completada exitosamente');
    return true;
  } catch (error) {
    logger.error('Error durante la inicialización:', error);
    return false;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initialize()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Error inesperado:', err);
      process.exit(1);
    });
}

module.exports = initialize;