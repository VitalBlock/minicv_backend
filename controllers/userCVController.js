const UserCV = require('../models/UserCV');
const Payment = require('../models/Payment'); // Asegúrate de importar el modelo de Payment
const logger = require('../utils/logger');
const { Op } = require('sequelize');

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

// Actualizar la plantilla de un CV existente
exports.applyTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { template } = req.body;

    if (!template) {
      return res.status(400).json({ error: 'Plantilla no especificada' });
    }

    // Elimina la verificación de pago, ahora todos pueden aplicar cualquier plantilla
    const cv = await UserCV.findOne({
      where: { id, userId }
    });

    if (!cv) {
      return res.status(404).json({ error: 'CV no encontrado' });
    }

    // Actualizar la plantilla
    cv.template = template;
    cv.isPremium = true; // Si quieres marcarlo como premium, pero no es obligatorio
    await cv.save();

    return res.status(200).json({
      success: true,
      message: 'Plantilla aplicada correctamente',
      cv
    });
  } catch (error) {
    logger.error('Error al aplicar plantilla a CV', error);
    return res.status(500).json({ 
      error: 'Error al aplicar plantilla a CV' 
    });
  }
};

// Añadir esta función al controlador

// Obtener los datos de un CV por plantilla
exports.getCVByTemplate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { template } = req.params;
    
    if (!template) {
      return res.status(400).json({ error: 'Plantilla no especificada' });
    }
    
    // Buscar CV con esta plantilla
    const cv = await UserCV.findOne({
      where: { 
        userId,
        template
      },
      order: [['updatedAt', 'DESC']] // Obtener el más reciente
    });
    
    if (!cv) {
      // Si no hay un CV con esa plantilla, crear uno nuevo con datos genéricos
      return res.status(200).json({
        success: true,
        data: {
          personalInfo: {
            name: "Tu Nombre",
            title: "Tu Profesión",
            email: "email@ejemplo.com",
            phone: "123456789",
            location: "Tu Ciudad"
          },
          sections: {
            experience: [],
            education: [],
            skills: []
          }
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      data: cv.cvData
    });
  } catch (error) {
    console.error('Error al obtener CV por plantilla:', error);
    return res.status(500).json({ 
      error: 'Error al obtener CV por plantilla' 
    });
  }
};