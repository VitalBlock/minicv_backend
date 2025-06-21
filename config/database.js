const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Usar las variables de entorno específicas de Railway
const DB_HOST = process.env.MYSQLHOST || 'localhost';
const DB_PORT = process.env.MYSQLPORT || '3306';
const DB_NAME = process.env.MYSQLDATABASE || 'railway';
const DB_USER = process.env.MYSQLUSER || 'root';
const DB_PASSWORD = process.env.MYSQLPASSWORD || '';

// Configuración de reintentos
const MAX_RETRIES = parseInt(process.env.DB_MAX_RETRIES || '5');
const RETRY_DELAY = parseInt(process.env.DB_RETRY_DELAY || '5000'); // 5 segundos

// Alternativa: usar directamente la URL de conexión de Railway si está disponible
const MYSQL_URL = process.env.MYSQL_URL;

// Crear instancia de Sequelize
const sequelize = MYSQL_URL 
  ? new Sequelize(MYSQL_URL) 
  : new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      port: DB_PORT,
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: {
        // No es necesario configurar SSL para conexiones internas en Railway
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });

// Función para probar la conexión con reintentos
const connectWithRetry = async (retries = MAX_RETRIES) => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL establecida correctamente.');
    console.log(`Host: ${DB_HOST}, Database: ${DB_NAME}, User: ${DB_USER}`);
    return true;
  } catch (error) {
    if (retries === 0) {
      console.error('Error al conectar a MySQL después de múltiples intentos:', error);
      return false;
    }
    
    console.log(`Error al conectar a MySQL. Reintentando en ${RETRY_DELAY/1000} segundos... (${retries} intentos restantes)`);
    console.error('Detalles del error:', error.message);
    
    // Esperar antes de reintentar
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    
    // Reintentar conexión
    return connectWithRetry(retries - 1);
  }
};

// Función para inicializar la base de datos con sincronización de modelos
const initializeDatabase = async (options = {}) => {
  const connected = await connectWithRetry();
  
  if (!connected) {
    if (process.env.NODE_ENV === 'production') {
      console.error('No se pudo conectar a la base de datos. El servicio puede funcionar con limitaciones.');
    } else {
      throw new Error('No se pudo establecer conexión a la base de datos.');
    }
  }
  
  // Sincronizar modelos si es necesario
  if (options.sync) {
    try {
      await sequelize.sync(options.syncOptions || {});
      console.log('Modelos sincronizados con la base de datos');
    } catch (error) {
      console.error('Error al sincronizar modelos:', error);
      throw error;
    }
  }
  
  return connected;
};

// Función simple para probar la conexión (retrocompatibilidad)
const testConnection = async () => {
  return connectWithRetry(1); // Un solo intento para compatibilidad
};

// Al final del archivo
module.exports = {
  sequelize,
  Sequelize,
  testConnection,
  connectWithRetry,
  initializeDatabase
};