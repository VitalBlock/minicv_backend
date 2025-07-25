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

exports.create = async (req, res) => {
  try {
    const { userId } = req.user;
    const letterData = req.body;
    
    const coverLetter = await CoverLetter.create({
      ...letterData,
      userId
    });
    
    res.status(201).json({
      success: true,
      coverLetter
    });
    
  } catch (error) {
    console.error('Error al crear carta de presentación:', error);
    res.status(500).json({ error: 'Error al crear carta' });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const coverLetters = await CoverLetter.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']]
    });
    
    res.json(coverLetters);
    
  } catch (error) {
    console.error('Error al obtener cartas:', error);
    res.status(500).json({ error: 'Error al obtener cartas' });
  }
};

// Obtener plantillas para cartas de presentación
exports.getTemplates = (req, res) => {
  try {
    // Lista de plantillas disponibles para cartas de presentación
    const templates = [
      { 
        id: 'standard', 
        name: 'Estándar', 
        description: 'Diseño profesional clásico adecuado para la mayoría de industrias' 
      },
      { 
        id: 'modern', 
        name: 'Moderno', 
        description: 'Diseño contemporáneo con elementos visuales actualizados' 
      },
      { 
        id: 'minimal', 
        name: 'Minimalista', 
        description: 'Diseño limpio y sencillo que destaca el contenido' 
      },
      { 
        id: 'creative', 
        name: 'Creativo', 
        description: 'Diseño distintivo para destacar en sectores creativos' 
      }
    ];
    
    return res.status(200).json(templates);
  } catch (error) {
    console.error('Error al obtener plantillas:', error);
    return res.status(500).json({ error: 'Error al recuperar plantillas' });
  }
};

// Añadir esta función también
exports.generatePDF = (req, res) => {
  try {
    // Nota: En una implementación real, aquí generaríamos un PDF
    // utilizando una biblioteca como PDFKit o similar
    
    // Por ahora, simplemente indicamos que el servicio está disponible
    return res.status(200).json({ 
      success: true, 
      message: 'Servicio de generación de PDF disponible',
      url: null // Aquí se devolvería la URL al PDF generado
    });
  } catch (error) {
    console.error('Error al generar PDF:', error);
    return res.status(500).json({ error: 'Error al generar PDF' });
  }
};