const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const logger = require('../utils/logger');

// Cerca de la línea 36, modifica para imprimir más información de diagnóstico
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Obtener token de cookie
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('Token encontrado en cookie');
    } 
    // O del encabezado Authorization
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token encontrado en header Authorization');
    }
    
    // Si no hay token
    if (!token) {
      console.log('No se encontró token ni en cookies ni en headers');
      console.log('Headers:', req.headers);
      console.log('Cookies:', req.cookies);
      return res.status(401).json({ 
        error: 'No autorizado, sin token',
        requiresAuth: true 
      });
    }
    
    try {
      // Verificar token
      const decoded = jwt.verify(token, config.jwtSecret);
      
      // Buscar usuario
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      
      if (!user) {
        return res.status(401).json({ error: 'Usuario no encontrado' });
      }
      
      // Añadir usuario a request
      req.user = user;
      next();
    } catch (error) {
      logger.error('Error al verificar token', error);
      return res.status(401).json({ 
        error: 'No autorizado, token inválido',
        requiresAuth: true 
      });
    }
  } catch (error) {
    logger.error('Error en middleware de autenticación', error);
    return res.status(500).json({ error: 'Error en servidor' });
  }
};