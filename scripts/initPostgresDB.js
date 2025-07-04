require('dotenv').config();
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');
const readline = require('readline');

// Importar todos los modelos
const User = require('../models/User');
const UserCV = require('../models/UserCV');
const SavedCV = require('../models/SavedCV');
const Payment = require('../models/Payment');
const CoverLetter = require('../models/CoverLetter');
const InterviewCategory = require('../models/InterviewCategory');
const InterviewSubcategory = require('../models/InterviewSubcategory');
const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewSession = require('../models/InterviewSession');
const InterviewExchange = require('../models/InterviewExchange');
const QuestionView = require('../models/QuestionView');
const ConversionEvent = require('../models/ConversionEvent');

// Función para solicitar confirmación por consola
function askForConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question + ' (y/N): ', answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

async function initializePostgresDB(options = {}) {
  try {
    logger.info('Conectando a PostgreSQL...');
    await sequelize.authenticate();
    logger.info('✅ Conexión establecida correctamente.');

    // Listar tablas antes de sincronizar
    const [tables] = await sequelize.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (tables.length > 0) {
      logger.warn(`Se encontraron ${tables.length} tablas existentes:`);
      logger.warn(tables.map(t => t.table_name).join(', '));
    }

    // Determinar el modo de sincronización basado en opciones y entorno
    const syncMode = options.syncMode || (process.env.DB_SYNC_MODE || 'alter');
    
    if (syncMode === 'force') {
      if (process.env.NODE_ENV === 'production') {
        logger.error('⚠️ ¡PELIGRO! sync({ force: true }) NO DEBE usarse en producción');
        
        if (!options.skipConfirmation && require.main === module) {
          const confirmed = await askForConfirmation('¿Estás SEGURO de que quieres ELIMINAR TODAS las tablas en PRODUCCIÓN?');
          if (!confirmed) {
            logger.info('❌ Operación cancelada por el usuario.');
            return false;
          }
        } else {
          return false;
        }
      }
      
      logger.warn('⚠️ ¡ATENCIÓN! sync({ force: true }) eliminará TODAS las tablas existentes.');
      
      if (tables.length > 0 && !options.skipConfirmation && require.main === module) {
        const confirmed = await askForConfirmation('¿Confirmas que quieres eliminar todas las tablas y datos?');
        if (!confirmed) {
          logger.info('❌ Operación cancelada por el usuario.');
          return false;
        }
      }
      
      // Sincronizar con force: true (elimina todas las tablas)
      logger.info('Sincronizando modelos con force: true...');
      await sequelize.sync({ force: true });
    } else {
      // Sincronizar con alter: true (preserva datos, modifica esquema)
      logger.info('Sincronizando modelos con alter: true (preserva datos)...');
      await sequelize.sync({ alter: true });
    }
    
    logger.info('✅ Todos los modelos sincronizados correctamente.');

    // Ejecutar sembrado de datos iniciales solo si es necesario
    if (syncMode === 'force' || options.seedData) {
      logger.info('Sembrando datos iniciales...');
      const seedInterviewData = require('./seedInterviewData');
      await seedInterviewData();
      logger.info('✅ Datos iniciales sembrados correctamente.');
    }

    logger.info('✅ Inicialización de PostgreSQL completada con éxito.');
    return true;
  } catch (error) {
    logger.error('❌ Error al inicializar PostgreSQL:', error);
    return false;
  } finally {
    if (require.main === module) {
      await sequelize.close();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  // Determinar opciones basadas en argumentos de línea de comandos
  const args = process.argv.slice(2);
  const options = {
    syncMode: args.includes('--force') ? 'force' : 'alter',
    seedData: args.includes('--seed'),
    skipConfirmation: args.includes('--yes')
  };
  
  initializePostgresDB(options)
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Error inesperado:', err);
      process.exit(1);
    });
}

module.exports = initializePostgresDB;