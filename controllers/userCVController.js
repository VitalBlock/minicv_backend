const UserCV = require('../models/UserCV');
const logger = require('../utils/logger');

// Guardar un nuevo CV
exports.saveCV = async (req, res) => {
  try {
    const { name, template, cvData } = req.body;
    const userId = req.user.id;
    
    if (!cvData) {
      return res.status(400).json({ error: 'Datos del CV son requeridos' });
    }
    
    const cv = await UserCV.create({
      userId,
      name: name || 'Mi CV',
      template: template || 'professional',
      cvData
    });
    
    return res.status(201).json(cv);
  } catch (error) {
    logger.error('Error al guardar CV', error);
    return res.status(500).json({ error: 'Error al guardar el CV' });
  }
};

// Obtener todos los CVs de un usuario
exports.getUserCVs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cvs = await UserCV.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json(cvs);
  } catch (error) {
    logger.error('Error al obtener CVs del usuario', error);
    return res.status(500).json({ error: 'Error al obtener los CVs' });
  }
};

// Obtener un CV específico
exports.getCV = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const cv = await UserCV.findOne({
      where: { id, userId }
    });
    
    if (!cv) {
      return res.status(404).json({ error: 'CV no encontrado' });
    }
    
    return res.status(200).json(cv);
  } catch (error) {
    logger.error('Error al obtener CV', error);
    return res.status(500).json({ error: 'Error al obtener el CV' });
  }
};

// Actualizar un CV existente
exports.updateCV = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, template, cvData } = req.body;
    
    const cv = await UserCV.findOne({
      where: { id, userId }
    });
    
    if (!cv) {
      return res.status(404).json({ error: 'CV no encontrado' });
    }
    
    // Actualizar campos
    if (name) cv.name = name;
    if (template) cv.template = template;
    if (cvData) cv.cvData = cvData;
    
    await cv.save();
    
    return res.status(200).json(cv);
  } catch (error) {
    logger.error('Error al actualizar CV', error);
    return res.status(500).json({ error: 'Error al actualizar el CV' });
  }
};

// Eliminar un CV
exports.deleteCV = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const cv = await UserCV.findOne({
      where: { id, userId }
    });
    
    if (!cv) {
      return res.status(404).json({ error: 'CV no encontrado' });
    }
    
    await cv.destroy();
    
    return res.status(200).json({ message: 'CV eliminado correctamente' });
  } catch (error) {
    logger.error('Error al eliminar CV', error);
    return res.status(500).json({ error: 'Error al eliminar el CV' });
  }
};