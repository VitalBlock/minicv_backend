// middleware/adminMiddleware.js
const { User } = require('../models');

exports.isAdmin = async (req, res, next) => {
  try {
    // El middleware authMiddleware.js ya debe haber verificado la autenticación
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    // Verificar si el usuario tiene rol de administrador
    if (req.user.role === 'admin') {
      next(); // Permitir acceso
    } else {
      res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    }
  } catch (error) {
    console.error('Error en middleware de administrador:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};