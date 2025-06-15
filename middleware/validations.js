/**
 * Valida los datos para crear una preferencia de pago
 */
exports.validatePreferenceData = (req, res, next) => {
  const { price } = req.body;

  // Validar que el precio sea un número válido
  if (price && (isNaN(price) || parseFloat(price) <= 0)) {
    return res.status(400).json({ error: 'El precio debe ser un número válido mayor que cero' });
  }

  next();
};