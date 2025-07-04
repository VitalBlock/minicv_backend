const { Op } = require('sequelize');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

/**
 * Middleware para verificar acceso premium
 */
const premiumAccess = async (req, res, next) => {
  try {
    const user = req.user;
    
    // Permitir acceso a administradores
    if (user.role === 'admin') {
      return next();
    }
    
    // Verificar si tiene suscripción activa
    const subscription = await Subscription.findOne({
      where: {
        userId: user.id,
        status: 'active',
        endDate: {
          [Op.gt]: new Date()
        }
      }
    });
    
    // Verificar si es usuario premium por compras individuales
    if (user.premium || subscription) {
      return next();
    }
    
    // Verificar límites gratuitos según la ruta
    if (req.originalUrl.includes('interview-questions')) {
      // Actualizar contador de vistas y permitir si no ha excedido
      if (user.free_interview_views < 5) {
        await User.update(
          { free_interview_views: user.free_interview_views + 1 },
          { where: { id: user.id } }
        );
        return next();
      }
    } else if (req.originalUrl.includes('interview-simulator')) {
      if (user.free_interview_sessions < 1) {
        await User.update(
          { free_interview_sessions: user.free_interview_sessions + 1 },
          { where: { id: user.id } }
        );
        return next();
      }
    } else if (req.originalUrl.includes('cover-letters') && req.method === 'POST') {
      // Permitir crear pero con marca de agua
      req.watermark = true;
      return next();
    }
    
    return res.status(403).json({ 
      error: 'Requiere suscripción premium',
      requiresPayment: true
    });
  } catch (error) {
    console.error('Error en verificación premium:', error);
    return res.status(500).json({ error: 'Error en servidor' });
  }
};

module.exports = premiumAccess;