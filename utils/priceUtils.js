/**
 * Obtiene el precio asociado a una plantilla específica
 * @param {string} template - Identificador de la plantilla
 * @returns {number} - Precio en pesos colombianos
 */
exports.getPriceByTemplate = (template) => {
  const prices = {
    'professional': 3000,
    'modern': 5000,
    'creative': 5000,
    'minimalist': 3000,
    'chronological': 5000,
    'executive': 7500,
    'international': 6000,
    'academic': 6000,
  };
  
  return prices[template] || 3000;
};