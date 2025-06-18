const SavedCV = require('../models/SavedCV');
const logger = require('../utils/logger');

// Guardar un CV
exports.saveCV = async (req, res) => {
  try {
    const { cvData, name, template } = req.body;
    // Verificar si el usuario está autenticado
    const userId = req.user ? req.user.id : null;
    
    if (!cvData) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se proporcionaron datos del CV' 
      });
    }
    
    // Crear o actualizar CV
    const [cv, created] = await SavedCV.findOrCreate({
      where: { 
        userId,
        name: name || 'Mi CV'
      },
      defaults: {
        userId,
        name: name || 'Mi CV',
        template: template || 'professional',
        data: cvData
      }
    });
    
    // Si ya existía, actualizar los datos
    if (!created) {
      cv.data = cvData;
      cv.template = template || cv.template;
      await cv.save();
    }
    
    logger.info('CV guardado correctamente', { 
      userId, 
      cvId: cv.id, 
      created 
    });
    
    return res.status(201).json({
      success: true,
      message: created ? 'CV guardado correctamente' : 'CV actualizado correctamente',
      cv: {
        id: cv.id,
        name: cv.name,
        template: cv.template,
        createdAt: cv.createdAt,
        updatedAt: cv.updatedAt
      }
    });
  } catch (error) {
    logger.error('Error al guardar CV', error);
    return res.status(500).json({
      success: false,
      message: 'Error al guardar el CV',
      error: error.message
    });
  }
};

// Obtener CVs del usuario
exports.getUserCVs = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cvs = await SavedCV.findAll({
      where: { userId },
      attributes: ['id', 'name', 'template', 'createdAt', 'updatedAt']
    });
    
    return res.status(200).json({
      success: true,
      cvs
    });
  } catch (error) {
    logger.error('Error al obtener CVs del usuario', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener los CVs',
      error: error.message
    });
  }
};

// Obtener un CV específico
exports.getCV = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const cv = await SavedCV.findOne({
      where: { id, userId }
    });
    
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV no encontrado'
      });
    }
    
    return res.status(200).json({
      success: true,
      cv
    });
  } catch (error) {
    logger.error('Error al obtener CV', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el CV',
      error: error.message
    });
  }
};

// Eliminar un CV
exports.deleteCV = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const cv = await SavedCV.findOne({
      where: { id, userId }
    });
    
    if (!cv) {
      return res.status(404).json({
        success: false,
        message: 'CV no encontrado'
      });
    }
    
    await cv.destroy();
    
    logger.info('CV eliminado correctamente', { userId, cvId: id });
    
    return res.status(200).json({
      success: true,
      message: 'CV eliminado correctamente'
    });
  } catch (error) {
    logger.error('Error al eliminar CV', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar el CV',
      error: error.message
    });
  }
};