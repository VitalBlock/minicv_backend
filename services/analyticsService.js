const ConversionEvent = require('../models/ConversionEvent');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Registra un evento de conversión
 */
exports.trackEvent = async (eventData) => {
  try {
    const event = await ConversionEvent.create(eventData);
    logger.info('Evento de conversión registrado', eventData);
    return event;
  } catch (error) {
    logger.error('Error al registrar evento de conversión', error);
    // No lanzamos el error para que no interrumpa el flujo principal
  }
};

/**
 * Obtiene estadísticas de conversión
 */
exports.getConversionStats = async (startDate, endDate) => {
  try {
    // Construir la cláusula WHERE para las fechas
    let dateCondition = '';
    let queryParams = {};
    
    if (startDate || endDate) {
      if (startDate && endDate) {
        dateCondition = 'WHERE createdAt BETWEEN :startDate AND :endDate';
        queryParams = { startDate, endDate: endDate + ' 23:59:59' };
      } else if (startDate) {
        dateCondition = 'WHERE createdAt >= :startDate';
        queryParams = { startDate };
      } else {
        dateCondition = 'WHERE createdAt <= :endDate';
        queryParams = { endDate: endDate + ' 23:59:59' };
      }
    }
    
    // Total de inicios de pago
    const [paymentsInitiatedResult] = await sequelize.query(
      `SELECT COUNT(*) as count FROM conversion_events 
       ${dateCondition} AND eventType = 'payment_initiated'`,
      { 
        replacements: queryParams,
        type: QueryTypes.SELECT
      }
    );
    
    // Total de pagos completados
    const [paymentsCompletedResult] = await sequelize.query(
      `SELECT COUNT(*) as count FROM conversion_events 
       ${dateCondition} AND eventType = 'payment_completed'`,
      { 
        replacements: queryParams,
        type: QueryTypes.SELECT
      }
    );
    
    // Total de pagos abandonados
    const [paymentsAbandonedResult] = await sequelize.query(
      `SELECT COUNT(*) as count FROM conversion_events 
       ${dateCondition} AND eventType = 'payment_abandoned'`,
      { 
        replacements: queryParams,
        type: QueryTypes.SELECT
      }
    );
    
    const paymentsInitiated = paymentsInitiatedResult.count;
    const paymentsCompleted = paymentsCompletedResult.count;
    const paymentsAbandoned = paymentsAbandonedResult.count;
    
    // Tasa de conversión
    const conversionRate = paymentsInitiated > 0 
      ? (paymentsCompleted / paymentsInitiated) * 100 
      : 0;
    
    // Estadísticas por plantilla
    const templateStats = await sequelize.query(
      `SELECT template, eventType, COUNT(*) as count 
       FROM conversion_events 
       ${dateCondition} AND template IS NOT NULL 
       GROUP BY template, eventType`,
      { 
        replacements: queryParams,
        type: QueryTypes.SELECT
      }
    );
    
    // Formatear para que coincida con la estructura esperada por el frontend
    const formattedTemplateStats = templateStats.map(stat => ({
      _id: {
        template: stat.template,
        eventType: stat.eventType
      },
      count: stat.count
    }));
    
    return {
      paymentsInitiated,
      paymentsCompleted,
      paymentsAbandoned,
      conversionRate: conversionRate.toFixed(2),
      templateStats: formattedTemplateStats
    };
  } catch (error) {
    logger.error('Error al obtener estadísticas de conversión', error);
    throw error;
  }
};