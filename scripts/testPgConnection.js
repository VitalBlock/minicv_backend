require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  // Configuración con SSL
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Intentando conectar a PostgreSQL...');
    await client.connect();
    console.log('¡Conexión exitosa!');
    
    const res = await client.query('SELECT current_timestamp as now');
    console.log('Servidor PostgreSQL: ', res.rows[0]);
    
    await client.end();
    return true;
  } catch (err) {
    console.error('Error de conexión:', err);
    return false;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Error inesperado:', err);
      process.exit(1);
    });
}

module.exports = testConnection;