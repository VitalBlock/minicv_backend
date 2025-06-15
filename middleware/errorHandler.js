const logger = require('../utils/logger');

/**
 * Middleware para manejo centralizado de errores
 */
exports.errorHandler = (err, req, res, next) => {
    logger.error('Error en el servidor', err);
    
    // Si es un error de MercadoPago, usar el formato adecuado
    if (err.name === 'MercadoPagoError') {
        return res.status(400).json({
            error: 'Error de MercadoPago',
            details: err.message,
            cause: err.cause
        });
    }
    
    // Errores generales
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message
    });
};