const testConnection = require('../scripts/testDbConnection');

exports.checkHealth = async (req, res) => {
  try {
    // Verificar la conexión a la base de datos
    const dbConnected = await testConnection();
    
    return res.status(200).json({
      status: 'ok',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};