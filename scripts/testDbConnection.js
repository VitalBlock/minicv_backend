require('dotenv').config();
const mysql = require('mysql2/promise');

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
  console.log(`${colors.cyan}Verificando conexión a MySQL en Railway...${colors.reset}`);
  
  // Mostrar variables de entorno disponibles (sin mostrar contraseñas completas)
  console.log(`${colors.yellow}Variables de entorno detectadas:${colors.reset}`);
  
  // Mostrar host
  const host = process.env.MYSQLHOST || (process.env.MYSQL_URL && new URL(process.env.MYSQL_URL).hostname);
  console.log(`- Host: ${colors.green}${host || 'No definido'}${colors.reset}`);
  
  // Mostrar puerto
  const port = process.env.MYSQLPORT || (process.env.MYSQL_URL && new URL(process.env.MYSQL_URL).port);
  console.log(`- Puerto: ${colors.green}${port || '3306 (default)'}${colors.reset}`);
  
  // Mostrar nombre de base de datos
  const database = process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 
                   (process.env.MYSQL_URL && new URL(process.env.MYSQL_URL).pathname.substring(1));
  console.log(`- Base de datos: ${colors.green}${database || 'No definida'}${colors.reset}`);
  
  // Mostrar usuario
  const user = process.env.MYSQLUSER || 
               (process.env.MYSQL_URL && new URL(process.env.MYSQL_URL).username);
  console.log(`- Usuario: ${colors.green}${user || 'No definido'}${colors.reset}`);
  
  // Mostrar si hay contraseña (sin mostrarla completa)
  const password = process.env.MYSQLPASSWORD || process.env.MYSQL_ROOT_PASSWORD || 
                  (process.env.MYSQL_URL && new URL(process.env.MYSQL_URL).password);
  console.log(`- Contraseña: ${colors.green}${password ? '********' + password.substring(password.length - 4) : 'No definida'}${colors.reset}`);
  
  // Mostrar URL completa si está disponible (con contraseña oculta)
  if (process.env.MYSQL_URL) {
    const url = new URL(process.env.MYSQL_URL);
    url.password = '********';
    console.log(`- URL de conexión: ${colors.green}${url.toString()}${colors.reset}`);
  }
  
  try {
    // Intentar conexión
    let connection;
    
    // Primero intentar con MYSQL_URL si está disponible
    if (process.env.MYSQL_URL) {
      console.log(`${colors.yellow}Intentando conexión con MYSQL_URL...${colors.reset}`);
      connection = await mysql.createConnection(process.env.MYSQL_URL);
    } 
    // Si no hay MYSQL_URL, intentar con variables individuales
    else if (process.env.MYSQLHOST && process.env.MYSQLUSER && process.env.MYSQLPASSWORD) {
      console.log(`${colors.yellow}Intentando conexión con variables individuales...${colors.reset}`);
      connection = await mysql.createConnection({
        host: process.env.MYSQLHOST,
        port: process.env.MYSQLPORT || 3306,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE || 'railway'
      });
    } else {
      throw new Error('No se encontraron credenciales suficientes para la conexión');
    }
    
    // Probar consulta simple
    console.log(`${colors.yellow}Ejecutando consulta de prueba...${colors.reset}`);
    const [rows] = await connection.execute('SELECT 1 as result');
    
    console.log(`${colors.green}✅ ¡Conexión exitosa!${colors.reset}`);
    console.log(`${colors.cyan}Resultado de prueba:${colors.reset}`, rows[0]);
    
    // Verificar si la tabla ConversionEvent existe
    try {
      const [tables] = await connection.execute("SHOW TABLES LIKE 'conversion_events'");
      if (tables.length > 0) {
        console.log(`${colors.green}✅ Tabla 'conversion_events' encontrada.${colors.reset}`);
        
        // Mostrar estructura de la tabla
        const [columns] = await connection.execute("DESCRIBE conversion_events");
        console.log(`${colors.cyan}Estructura de la tabla:${colors.reset}`);
        columns.forEach(col => {
          console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(requerido)' : ''}`);
        });
        
        // Contar registros
        const [count] = await connection.execute("SELECT COUNT(*) as total FROM conversion_events");
        console.log(`${colors.cyan}Total de registros: ${colors.green}${count[0].total}${colors.reset}`);
      } else {
        console.log(`${colors.yellow}⚠️ Tabla 'conversion_events' no encontrada.${colors.reset}`);
        console.log(`${colors.cyan}Se creará automáticamente cuando inicies el servidor.${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.yellow}⚠️ No se pudo verificar la tabla 'conversion_events': ${error.message}${colors.reset}`);
    }
    
    // Cerrar conexión
    await connection.end();
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Error de conexión: ${error.message}${colors.reset}`);
    
    // Proporcionar sugerencias según el error
    if (error.message.includes('connect ETIMEDOUT')) {
      console.log(`${colors.yellow}Sugerencia: Verifica que la IP de tu servidor esté en la lista de IPs permitidas en Railway.${colors.reset}`);
    } else if (error.message.includes('Access denied')) {
      console.log(`${colors.yellow}Sugerencia: Verifica que el nombre de usuario y contraseña sean correctos.${colors.reset}`);
    } else if (error.message.includes('Unknown database')) {
      console.log(`${colors.yellow}Sugerencia: La base de datos no existe. Verifica el nombre o créala.${colors.reset}`);
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