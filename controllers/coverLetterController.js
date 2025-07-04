const CoverLetter = require('../models/CoverLetter');
const logger = require('../utils/logger');

// Guardar una carta de presentación
exports.saveCoverLetter = async (req, res) => {
  try {
    const { name, content, jobPosition, company, letterData } = req.body;
    const userId = req.user.id;
    
    if (!content) {
      return res.status(400).json({ error: 'El contenido de la carta es requerido' });
    }
    
    const coverLetter = await CoverLetter.create({
      userId,
      name: name || 'Mi Carta de Presentación',
      content,
      jobPosition,
      company,
      letterData
    });
    
    return res.status(201).json(coverLetter);
  } catch (error) {
    logger.error('Error al guardar carta de presentación', error);
    return res.status(500).json({ error: 'Error al guardar la carta de presentación' });
  }
};

// Obtener todas las cartas de un usuario
exports.getUserCoverLetters = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const coverLetters = await CoverLetter.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json(coverLetters);
  } catch (error) {
    logger.error('Error al obtener cartas del usuario', error);
    return res.status(500).json({ error: 'Error al obtener las cartas de presentación' });
  }
};

// Obtener una carta específica
exports.getCoverLetter = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const coverLetter = await CoverLetter.findOne({
      where: { id, userId }
    });
    
    if (!coverLetter) {
      return res.status(404).json({ error: 'Carta de presentación no encontrada' });
    }
    
    return res.status(200).json(coverLetter);
  } catch (error) {
    logger.error('Error al obtener carta de presentación', error);
    return res.status(500).json({ error: 'Error al obtener la carta de presentación' });
  }
};

// Actualizar una carta existente
exports.updateCoverLetter = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, content, jobPosition, company, letterData } = req.body;
    
    const coverLetter = await CoverLetter.findOne({
      where: { id, userId }
    });
    
    if (!coverLetter) {
      return res.status(404).json({ error: 'Carta de presentación no encontrada' });
    }
    
    // Actualizar campos
    if (name) coverLetter.name = name;
    if (content) coverLetter.content = content;
    if (jobPosition !== undefined) coverLetter.jobPosition = jobPosition;
    if (company !== undefined) coverLetter.company = company;
    if (letterData) coverLetter.letterData = letterData;
    
    await coverLetter.save();
    
    return res.status(200).json(coverLetter);
  } catch (error) {
    logger.error('Error al actualizar carta de presentación', error);
    return res.status(500).json({ error: 'Error al actualizar la carta de presentación' });
  }
};

// Eliminar una carta
exports.deleteCoverLetter = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const coverLetter = await CoverLetter.findOne({
      where: { id, userId }
    });
    
    if (!coverLetter) {
      return res.status(404).json({ error: 'Carta de presentación no encontrada' });
    }
    
    await coverLetter.destroy();
    
    return res.status(200).json({ message: 'Carta de presentación eliminada correctamente' });
  } catch (error) {
    logger.error('Error al eliminar carta de presentación', error);
    return res.status(500).json({ error: 'Error al eliminar la carta de presentación' });
  }
};