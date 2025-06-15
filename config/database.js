const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Usar las variables de entorno específicas de Railway
const DB_HOST = process.env.MYSQLHOST || 'localhost';
const DB_PORT = process.env.MYSQLPORT || '3306';
const DB_NAME = process.env.MYSQLDATABASE || 'railway';
const DB_USER = process.env.MYSQLUSER || 'root';
const DB_PASSWORD = process.env.MYSQLPASSWORD || '';

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

// Función para probar la conexión
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a MySQL establecida correctamente en Railway.');
    console.log(`Host: ${DB_HOST}, Database: ${DB_NAME}, User: ${DB_USER}`);
  } catch (error) {
    console.error('Error al conectar a MySQL:', error);
  }
};

module.exports = {
  sequelize,
  testConnection
};