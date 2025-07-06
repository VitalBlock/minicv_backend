const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar si el usuario está autenticado
exports.requireAuth = async (req, res, next) => {
  try {
    // Verificar primero la cookie
    const token = req.cookies.token;
    
    // Si no hay cookie, verificar el encabezado de autorización
    const authHeader = req.headers.authorization;
    const headerToken = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    
    // Usar el token de la cookie o del encabezado
    const finalToken = token || headerToken;
    
    if (!finalToken) {
      return res.status(401).json({ 
        error: 'Acceso no autorizado. Por favor inicia sesión.',
        requiresAuth: true
      });
    }
    
    // Verificar la validez del token
    try {
      const decoded = jwt.verify(finalToken, process.env.JWT_SECRET);
      
      // Verificar que el usuario existe en la base de datos
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return res.status(401).json({ 
          error: 'Usuario no encontrado. Por favor inicia sesión nuevamente.',
          requiresAuth: true 
        });
      }
      
      // Asignar el usuario a req.user para uso en controladores
      req.user = user;
      
      // Si el token vino del header y no hay cookie, establecer la cookie
      if (headerToken && !token) {
        res.cookie('token', headerToken, {
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
        });
      }
      
      next();
    } catch (error) {
      // El token es inválido o ha expirado
      console.error('Error al verificar token:', error);
      return res.status(401).json({ 
        error: 'Sesión expirada. Por favor inicia sesión nuevamente.',
        requiresAuth: true 
      });
    }
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Middleware para verificar si el usuario es administrador
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de administrador.' });
  }
  next();
};