const InterviewCategory = require('../models/InterviewCategory');
const InterviewSubcategory = require('../models/InterviewSubcategory');
const InterviewQuestion = require('../models/InterviewQuestion');
const QuestionView = require('../models/QuestionView');
const User = require('../models/User');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Obtener todas las categorías de preguntas
exports.getCategories = async (req, res) => {
  try {
    const categories = await InterviewCategory.findAll({
      include: [{
        model: InterviewSubcategory,
        as: 'subcategories'
      }],
      order: [
        ['name', 'ASC'],
        [{ model: InterviewSubcategory, as: 'subcategories' }, 'name', 'ASC']
      ]
    });
    
    return res.status(200).json(categories);
  } catch (error) {
    logger.error('Error al obtener categorías de preguntas', error);
    return res.status(500).json({ error: 'Error al obtener categorías de preguntas' });
  }
};

// Obtener preguntas por categoría
exports.getQuestionsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const userId = req.user?.id;
    const sessionId = req.cookies?.sessionId;
    
    // Verificar si el usuario puede ver preguntas premium
    const hasPremiumAccess = await checkPremiumAccess(userId, sessionId);
    
    // Verificar límite de vistas gratuitas
    if (!hasPremiumAccess) {
      const canView = await checkFreeQuestionViewsLimit(userId, sessionId);
      if (!canView) {
        return res.status(403).json({ 
          error: 'Has alcanzado el límite de preguntas gratuitas por hoy',
          requiresPayment: true
        });
      }
    }
    
    // Condición para filtrar preguntas premium
    const premiumCondition = hasPremiumAccess ? {} : { isPremium: false };
    
    const questions = await InterviewQuestion.findAll({
      where: {
        categoryId,
        ...premiumCondition
      },
      include: [
        {
          model: InterviewCategory,
          as: 'category'
        },
        {
          model: InterviewSubcategory,
          as: 'subcategory'
        }
      ],
      order: [
        ['difficulty', 'ASC'],
        ['question', 'ASC']
      ]
    });
    
    // Registrar vista de preguntas si no es premium
    if (!hasPremiumAccess && questions.length > 0) {
      await registerQuestionView(userId, sessionId);
    }
    
    return res.status(200).json({
      questions,
      hasPremiumAccess,
      remainingViews: await getRemainingViews(userId, sessionId)
    });
  } catch (error) {
    logger.error('Error al obtener preguntas por categoría', error);
    return res.status(500).json({ error: 'Error al obtener preguntas' });
  }
};

// Obtener preguntas por subcategoría
exports.getQuestionsBySubcategory = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;
    const userId = req.user?.id;
    const sessionId = req.cookies?.sessionId;
    
    // Verificar si el usuario puede ver preguntas premium
    const hasPremiumAccess = await checkPremiumAccess(userId, sessionId);
    
    // Verificar límite de vistas gratuitas
    if (!hasPremiumAccess) {
      const canView = await checkFreeQuestionViewsLimit(userId, sessionId);
      if (!canView) {
        return res.status(403).json({ 
          error: 'Has alcanzado el límite de preguntas gratuitas por hoy',
          requiresPayment: true
        });
      }
    }
    
    // Condición para filtrar preguntas premium
    const premiumCondition = hasPremiumAccess ? {} : { isPremium: false };
    
    const questions = await InterviewQuestion.findAll({
      where: {
        categoryId,
        subcategoryId,
        ...premiumCondition
      },
      include: [
        {
          model: InterviewCategory,
          as: 'category'
        },
        {
          model: InterviewSubcategory,
          as: 'subcategory'
        }
      ],
      order: [
        ['difficulty', 'ASC'],
        ['question', 'ASC']
      ]
    });
    
    // Registrar vista de preguntas si no es premium
    if (!hasPremiumAccess && questions.length > 0) {
      await registerQuestionView(userId, sessionId);
    }
    
    return res.status(200).json({
      questions,
      hasPremiumAccess,
      remainingViews: await getRemainingViews(userId, sessionId)
    });
  } catch (error) {
    logger.error('Error al obtener preguntas por subcategoría', error);
    return res.status(500).json({ error: 'Error al obtener preguntas' });
  }
};

// Registrar uso de preguntas gratuitas
exports.registerUsage = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.cookies?.sessionId;
    
    // Verificar si el usuario tiene acceso premium
    const hasPremiumAccess = await checkPremiumAccess(userId, sessionId);
    if (hasPremiumAccess) {
      return res.status(200).json({ 
        success: true, 
        message: 'Usuario premium sin límites de vistas',
        hasPremiumAccess: true,
        remainingViews: null
      });
    }
    
    // Registrar vista
    await registerQuestionView(userId, sessionId);
    
    // Obtener vistas restantes
    const remainingViews = await getRemainingViews(userId, sessionId);
    
    return res.status(200).json({
      success: true,
      message: 'Uso registrado correctamente',
      hasPremiumAccess: false,
      remainingViews
    });
  } catch (error) {
    logger.error('Error al registrar uso de preguntas', error);
    return res.status(500).json({ error: 'Error al registrar uso' });
  }
};

// Funciones auxiliares
async function checkPremiumAccess(userId, sessionId) {
  try {
    // Si hay usuario autenticado
    if (userId) {
      // Buscar pagos activos para entrevistas
      const payment = await Payment.findOne({
        where: {
          userId,
          status: 'approved',
          template: 'interview-questions'
        }
      });
      
      return !!payment;
    }
    
    // Si no hay usuario pero hay sesión
    if (sessionId) {
      const payment = await Payment.findOne({
        where: {
          sessionId,
          status: 'approved',
          template: 'interview-questions'
        }
      });
      
      return !!payment;
    }
    
    return false;
  } catch (error) {
    logger.error('Error al verificar acceso premium', error);
    return false;
  }
}

async function checkFreeQuestionViewsLimit(userId, sessionId) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (userId) {
      // Buscar vistas de hoy para el usuario
      const views = await QuestionView.findOne({
        where: {
          userId,
          date: today
        }
      });
      
      // Buscar el límite de vistas gratuitas del usuario
      const user = await User.findByPk(userId);
      const freeLimit = user.freeQuestionViews || 20;
      
      // Si no hay vistas hoy o está dentro del límite
      return !views || views.count < freeLimit;
    }
    
    if (sessionId) {
      // Buscar vistas de hoy para la sesión
      const views = await QuestionView.findOne({
        where: {
          sessionId,
          date: today,
          userId: null
        }
      });
      
      // Límite estándar para usuarios no autenticados
      const freeLimit = 10;
      
      // Si no hay vistas hoy o está dentro del límite
      return !views || views.count < freeLimit;
    }
    
    return true; // Si no hay usuario ni sesión (caso raro), permitir
  } catch (error) {
    logger.error('Error al verificar límite de vistas gratuitas', error);
    return false;
  }
}

async function registerQuestionView(userId, sessionId) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (userId) {
      // Buscar o crear registro de vistas para hoy
      const [views, created] = await QuestionView.findOrCreate({
        where: {
          userId,
          date: today
        },
        defaults: {
          userId,
          date: today,
          count: 1
        }
      });
      
      // Si ya existía, incrementar contador
      if (!created) {
        views.count += 1;
        await views.save();
      }
      
      return views;
    }
    
    if (sessionId) {
      // Buscar o crear registro de vistas para la sesión
      const [views, created] = await QuestionView.findOrCreate({
        where: {
          sessionId,
          date: today,
          userId: null
        },
        defaults: {
          sessionId,
          date: today,
          count: 1,
          userId: null
        }
      });
      
      // Si ya existía, incrementar contador
      if (!created) {
        views.count += 1;
        await views.save();
      }
      
      return views;
    }
    
    return null;
  } catch (error) {
    logger.error('Error al registrar vista de preguntas', error);
    return null;
  }
}

async function getRemainingViews(userId, sessionId) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (userId) {
      // Buscar vistas de hoy para el usuario
      const views = await QuestionView.findOne({
        where: {
          userId,
          date: today
        }
      });
      
      // Buscar el límite de vistas gratuitas del usuario
      const user = await User.findByPk(userId);
      const freeLimit = user.freeQuestionViews || 20;
      
      // Calcular vistas restantes
      return views ? Math.max(0, freeLimit - views.count) : freeLimit;
    }
    
    if (sessionId) {
      // Buscar vistas de hoy para la sesión
      const views = await QuestionView.findOne({
        where: {
          sessionId,
          date: today,
          userId: null
        }
      });
      
      // Límite estándar para usuarios no autenticados
      const freeLimit = 10;
      
      // Calcular vistas restantes
      return views ? Math.max(0, freeLimit - views.count) : freeLimit;
    }
    
    return 10; // Valor por defecto para nuevos usuarios
  } catch (error) {
    logger.error('Error al obtener vistas restantes', error);
    return 0;
  }
}