const InterviewSession = require('../models/InterviewSession');
const InterviewExchange = require('../models/InterviewExchange');
const aiService = require('../services/aiService');
const Payment = require('../models/Payment');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Iniciar una nueva sesión de entrevista
exports.startInterview = async (req, res) => {
  try {
    const { jobTitle, industry, difficulty } = req.body;
    const userId = req.user?.id;
    const sessionCookieId = req.cookies.sessionId || uuidv4();
    
    // Validar datos
    if (!jobTitle) {
      return res.status(400).json({ error: 'El título del puesto es requerido' });
    }
    
    // Verificar si hay sesiones activas que se puedan retomar
    const activeSession = await InterviewSession.findOne({
      where: {
        status: 'active',
        ...(userId ? { userId } : { sessionId: sessionCookieId })
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (activeSession) {
      // Buscar intercambios existentes
      const exchanges = await InterviewExchange.findAll({
        where: { sessionId: activeSession.id },
        order: [['questionNumber', 'ASC']]
      });
      
      return res.status(200).json({
        message: 'Sesión activa encontrada',
        session: activeSession,
        exchanges,
        resuming: true
      });
    }
    
    // Verificar acceso premium
    const hasPremiumAccess = await checkPremiumAccess(userId, sessionCookieId);
    
    // Verificar límite para usuarios no premium
    if (!hasPremiumAccess) {
      const freeSessionsLeft = await checkFreeSessionsLimit(userId, sessionCookieId);
      
      if (freeSessionsLeft <= 0) {
        return res.status(403).json({
          error: 'Has alcanzado el límite de entrevistas gratuitas',
          requiresPayment: true
        });
      }
    }
    
    // Crear nueva sesión
    const session = await InterviewSession.create({
      userId,
      sessionId: sessionCookieId,
      jobTitle,
      industry,
      difficulty: difficulty || 'intermediate',
      status: 'active'
    });
    
    // Generar primera pregunta
    const question = await aiService.generateInterviewQuestion(
      jobTitle,
      industry,
      difficulty || 'intermediate'
    );
    
    // Guardar primera pregunta
    const exchange = await InterviewExchange.create({
      sessionId: session.id,
      question,
      questionNumber: 1
    });
    
    // Si no hay cookie de sesión, establecerla
    if (!req.cookies.sessionId) {
      res.cookie('sessionId', sessionCookieId, { 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      });
    }
    
    return res.status(201).json({
      message: 'Entrevista iniciada',
      session,
      currentQuestion: {
        id: exchange.id,
        question: exchange.question,
        questionNumber: exchange.questionNumber
      },
      hasPremiumAccess,
      freeSessionsLeft: hasPremiumAccess ? null : await checkFreeSessionsLimit(userId, sessionCookieId)
    });
  } catch (error) {
    logger.error('Error al iniciar entrevista', error);
    return res.status(500).json({ error: 'Error al iniciar la entrevista' });
  }
};

// Enviar respuesta y obtener siguiente pregunta
exports.answerAndGetNext = async (req, res) => {
  try {
    const { sessionId, exchangeId, answer } = req.body;
    
    if (!sessionId || !exchangeId || !answer) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }
    
    // Buscar sesión y verificar que esté activa
    const session = await InterviewSession.findOne({
      where: { id: sessionId, status: 'active' }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada o no activa' });
    }
    
    // Buscar intercambio actual
    const exchange = await InterviewExchange.findOne({
      where: { id: exchangeId, sessionId }
    });
    
    if (!exchange) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }
    
    // Guardar respuesta
    exchange.answer = answer;
    
    // Analizar respuesta con IA
    const analysis = await aiService.analyzeAnswer(
      session.jobTitle,
      exchange.question,
      answer,
      session.difficulty
    );
    
    exchange.aiAnalysis = analysis.analysis;
    exchange.score = analysis.score;
    await exchange.save();
    
    // Buscar todas las preguntas anteriores
    const previousQuestions = await InterviewExchange.findAll({
      where: { sessionId },
      attributes: ['question'],
      order: [['questionNumber', 'ASC']]
    });
    
    const questionList = previousQuestions.map(q => q.question);
    
    // Determinar si debemos continuar o finalizar
    const totalQuestions = 5; // Configurable
    
    if (exchange.questionNumber >= totalQuestions) {
      // Finalizar entrevista
      session.status = 'completed';
      
      // Generar retroalimentación final
      const allExchanges = await InterviewExchange.findAll({
        where: { sessionId },
        order: [['questionNumber', 'ASC']]
      });
      
      const feedback = await aiService.generateFinalFeedback(
        session.jobTitle,
        allExchanges
      );
      
      session.feedback = feedback.feedback;
      session.score = feedback.score;
      
      // Calcular duración
      const durationMs = new Date() - new Date(session.createdAt);
      session.duration = Math.floor(durationMs / 1000); // en segundos
      
      await session.save();
      
      return res.status(200).json({
        message: 'Entrevista completada',
        isComplete: true,
        session,
        analysis: {
          text: analysis.analysis,
          score: analysis.score
        },
        feedback: feedback.feedback,
        finalScore: feedback.score
      });
    }
    
    // Generar siguiente pregunta
    const nextQuestion = await aiService.generateInterviewQuestion(
      session.jobTitle,
      session.industry,
      session.difficulty,
      questionList
    );
    
    // Guardar siguiente pregunta
    const nextExchange = await InterviewExchange.create({
      sessionId: session.id,
      question: nextQuestion,
      questionNumber: exchange.questionNumber + 1
    });
    
    return res.status(200).json({
      message: 'Respuesta analizada y siguiente pregunta generada',
      isComplete: false,
      analysis: {
        text: analysis.analysis,
        score: analysis.score
      },
      nextQuestion: {
        id: nextExchange.id,
        question: nextExchange.question,
        questionNumber: nextExchange.questionNumber
      },
      progress: {
        current: nextExchange.questionNumber,
        total: totalQuestions
      }
    });
  } catch (error) {
    logger.error('Error al procesar respuesta', error);
    return res.status(500).json({ error: 'Error al procesar la respuesta' });
  }
};

// Obtener historial de entrevistas
exports.getInterviewHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.cookies.sessionId;
    
    if (!userId && !sessionId) {
      return res.status(400).json({ error: 'Se requiere autenticación o ID de sesión' });
    }
    
    const whereClause = userId 
      ? { userId }
      : { sessionId };
    
    const sessions = await InterviewSession.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    // Obtener detalles de cada sesión
    const sessionsWithDetails = await Promise.all(sessions.map(async (session) => {
      const exchanges = await InterviewExchange.findAll({
        where: { sessionId: session.id },
        order: [['questionNumber', 'ASC']]
      });
      
      return {
        ...session.toJSON(),
        exchanges
      };
    }));
    
    return res.status(200).json({
      sessions: sessionsWithDetails,
      hasPremiumAccess: await checkPremiumAccess(userId, sessionId),
      freeSessionsLeft: await checkFreeSessionsLimit(userId, sessionId)
    });
  } catch (error) {
    logger.error('Error al obtener historial de entrevistas', error);
    return res.status(500).json({ error: 'Error al obtener historial de entrevistas' });
  }
};

// Funciones auxiliares
async function checkPremiumAccess(userId, sessionId) {
  try {
    // Si hay usuario autenticado
    if (userId) {
      // Buscar pagos activos para simulador de entrevistas
      const payment = await Payment.findOne({
        where: {
          userId,
          status: 'approved',
          template: 'interview-simulator'
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
          template: 'interview-simulator'
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

async function checkFreeSessionsLimit(userId, sessionId) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const startOfToday = new Date(today);
    
    // Limitar a 1 sesión gratuita por día
    const MAX_FREE_SESSIONS = 1;
    
    const whereClause = userId
      ? { userId, createdAt: { [Op.gte]: startOfToday } }
      : { sessionId, createdAt: { [Op.gte]: startOfToday } };
    
    const sessionsToday = await InterviewSession.count({
      where: whereClause
    });
    
    return Math.max(0, MAX_FREE_SESSIONS - sessionsToday);
  } catch (error) {
    logger.error('Error al verificar límite de sesiones gratuitas', error);
    return 0;
  }
}