const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const POSTGRES_URL = process.env.DATABASE_URL;

const sequelize = POSTGRES_URL
  ? new Sequelize(POSTGRES_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    })
  : new Sequelize({
      database: process.env.PGDATABASE,
      username: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      host: process.env.PGHOST,
      port: process.env.PGPORT || 5432,
      dialect: 'postgres'
    });

// Conexión con reintentos, igual que antes
const MAX_RETRIES = parseInt(process.env.DB_MAX_RETRIES || '5');
const RETRY_DELAY = parseInt(process.env.DB_RETRY_DELAY || '5000');

const connectWithRetry = async (retries = MAX_RETRIES) => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL correctamente.');
    return true;
  } catch (error) {
    if (retries === 0) {
      console.error('❌ Error tras múltiples intentos:', error);
      return false;
    }

    console.warn(`Reintentando conexión en ${RETRY_DELAY / 1000}s... (${retries} restantes)`);
    await new Promise(res => setTimeout(res, RETRY_DELAY));
    return connectWithRetry(retries - 1);
  }
};

const initializeDatabase = async (options = {}) => {
  const connected = await connectWithRetry();

  if (!connected) {
    throw new Error('No se pudo establecer conexión con PostgreSQL');
  }

  if (options.sync) {
    try {
      await sequelize.sync(options.syncOptions || {});
      console.log('✅ Modelos sincronizados con PostgreSQL');
    } catch (error) {
      console.error('❌ Error al sincronizar modelos:', error);
      throw error;
    }
  }

  return connected;
};

module.exports = {
  sequelize,
  Sequelize,
  connectWithRetry,
  initializeDatabase
};
