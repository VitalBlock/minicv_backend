const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar si el usuario está autenticado
exports.requireAuth = async (req, res, next) => {
  try {
    // Verificar si existe token en las cookies
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Acceso no autorizado. Por favor inicia sesión.' });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario en la base de datos
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    
    // Añadir usuario al objeto de solicitud para uso en otros middlewares
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      premium: user.premium
    };
    
    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Middleware para verificar si el usuario es administrador
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de administrador.' });
  }
  next();
};