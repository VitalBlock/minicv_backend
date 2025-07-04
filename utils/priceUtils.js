/**
 * Obtiene el precio asociado a un producto específico
 * @param {string} template - Identificador del producto
 * @returns {number} - Precio en pesos colombianos
 */
exports.getPriceByTemplate = (template) => {
  const prices = {
    // CV Templates
    'professional': 3000,
    'modern': 5000,
    'creative': 5000,
    'minimalist': 3000,
    'chronological': 5000,
    'executive': 7500,
    'international': 6000,
    'academic': 6000,
    'mixed': 6000,
    'functional': 5000,
    
    // Nuevos productos
    'cover-letter': 4500,
    'interview-questions': 6000,
    'interview-simulator': 7500,
    
    // Paquetes
    'premium-bundle': 15000,
  };
  
  return prices[template] || 3000;
};

/**
 * Obtiene la descripción de un producto
 * @param {string} template - Identificador del producto
 * @returns {string} - Descripción del producto
 */
exports.getProductDescription = (template) => {
  const descriptions = {
    // CV Templates
    'professional': 'Plantilla de CV Profesional - Descarga ilimitada por 30 días',
    'modern': 'Plantilla de CV Moderno - Descarga ilimitada por 30 días',
    'creative': 'Plantilla de CV Creativo - Descarga ilimitada por 30 días',
    'minimalist': 'Plantilla de CV Minimalista - Descarga ilimitada por 30 días',
    'chronological': 'Plantilla de CV Cronológico - Descarga ilimitada por 30 días',
    'executive': 'Plantilla de CV Ejecutivo - Descarga ilimitada por 30 días',
    'international': 'Plantilla de CV Internacional - Descarga ilimitada por 30 días',
    'academic': 'Plantilla de CV Académico - Descarga ilimitada por 30 días',
    'mixed': 'Plantilla de CV Mixto - Descarga ilimitada por 30 días',
    'functional': 'Plantilla de CV Funcional - Descarga ilimitada por 30 días',
    
    // Nuevos productos
    'cover-letter': 'Generador de Cartas de Presentación - Acceso ilimitado por 30 días',
    'interview-questions': 'Banco de Preguntas de Entrevista - Acceso ilimitado por 30 días',
    'interview-simulator': 'Simulador de Entrevistas con IA - Acceso ilimitado por 30 días',
    
    // Paquetes
    'premium-bundle': 'Paquete Premium - Acceso a todas las funcionalidades por 30 días',
  };
  
  return descriptions[template] || 'Producto MiniCV';
};