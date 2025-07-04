require('dotenv').config();
const { Client } = require('pg');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

async function testConnection() {
  console.log(`${colors.cyan}Verificando conexión a PostgreSQL...${colors.reset}`);
  
  // Mostrar variables de entorno disponibles (sin mostrar contraseñas completas)
  console.log(`${colors.yellow}Variables de entorno detectadas:${colors.reset}`);
  
  // Verificar si existe DATABASE_URL
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    url.password = '********';
    console.log(`- URL de conexión: ${colors.green}${url.toString()}${colors.reset}`);
    
    // Mostrar componentes individuales
    console.log(`- Host: ${colors.green}${url.hostname}${colors.reset}`);
    console.log(`- Puerto: ${colors.green}${url.port || '5432 (default)'}${colors.reset}`);
    console.log(`- Base de datos: ${colors.green}${url.pathname.substring(1)}${colors.reset}`);
    console.log(`- Usuario: ${colors.green}${url.username}${colors.reset}`);
    console.log(`- Contraseña: ${colors.green}${'********' + (url.password ? url.password.substring(url.password.length - 4) : '')}${colors.reset}`);
  } else {
    // Mostrar variables individuales
    console.log(`- Host: ${colors.green}${process.env.PGHOST || 'No definido'}${colors.reset}`);
    console.log(`- Puerto: ${colors.green}${process.env.PGPORT || '5432 (default)'}${colors.reset}`);
    console.log(`- Base de datos: ${colors.green}${process.env.PGDATABASE || 'No definida'}${colors.reset}`);
    console.log(`- Usuario: ${colors.green}${process.env.PGUSER || 'No definido'}${colors.reset}`);
    console.log(`- Contraseña: ${colors.green}${process.env.PGPASSWORD ? '********' + process.env.PGPASSWORD.substring(process.env.PGPASSWORD.length - 4) : 'No definida'}${colors.reset}`);
  }
  
  try {
    // Configuración del cliente
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Intentar conexión
    console.log(`${colors.yellow}Intentando conectar a PostgreSQL...${colors.reset}`);
    await client.connect();
    console.log(`${colors.green}✅ ¡Conexión exitosa!${colors.reset}`);
    
    // Probar consulta simple
    console.log(`${colors.yellow}Ejecutando consulta de prueba...${colors.reset}`);
    const res = await client.query('SELECT current_timestamp as now');
    console.log(`${colors.cyan}Servidor PostgreSQL: ${colors.reset}`, res.rows[0]);
    
    // Verificar si la tabla conversion_events existe
    try {
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'conversion_events'
      `);
      
      if (tables.rowCount > 0) {
        console.log(`${colors.green}✅ Tabla 'conversion_events' encontrada.${colors.reset}`);
        
        // Mostrar estructura de la tabla
        const columns = await client.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'conversion_events'
        `);
        
        console.log(`${colors.cyan}Estructura de la tabla:${colors.reset}`);
        columns.rows.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(requerido)' : ''}`);
        });
        
        // Contar registros
        const count = await client.query('SELECT COUNT(*) as total FROM conversion_events');
        console.log(`${colors.cyan}Total de registros: ${colors.green}${count.rows[0].total}${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠️ Tabla 'conversion_events' no encontrada.${colors.reset}`);
        console.log(`${colors.cyan}Se creará automáticamente cuando inicies el servidor.${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.yellow}⚠️ No se pudo verificar la tabla 'conversion_events': ${error.message}${colors.reset}`);
    }
    
    // Cerrar conexión
    await client.end();
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Error de conexión: ${error.message}${colors.reset}`);
    
    // Proporcionar sugerencias según el error
    if (error.message.includes('ETIMEDOUT')) {
      console.log(`${colors.yellow}Sugerencia: Verifica que la IP de tu servidor esté en la lista de IPs permitidas.${colors.reset}`);
    } else if (error.message.includes('password authentication failed')) {
      console.log(`${colors.yellow}Sugerencia: Verifica que el nombre de usuario y contraseña sean correctos.${colors.reset}`);
    } else if (error.message.includes('does not exist')) {
      console.log(`${colors.yellow}Sugerencia: La base de datos no existe. Verifica el nombre o créala.${colors.reset}`);
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log(`${colors.yellow}Sugerencia: No se puede conectar al servidor. Verifica que esté en ejecución y que el host/puerto sean correctos.${colors.reset}`);
    } else if (error.message.includes('SSL')) {
      console.log(`${colors.yellow}Sugerencia: Hay un problema con la conexión SSL. Intenta configurar la opción rejectUnauthorized: false.${colors.reset}`);
    }
    
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
      console.error(`${colors.red}Error inesperado: ${err}${colors.reset}`);
      process.exit(1);
    });
}

module.exports = testConnection;