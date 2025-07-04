const User = require('../models/User');
const logger = require('../utils/logger');

// Iniciar sesión de entrevista
exports.startSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { interviewType } = req.body;
    
    // Verificar si el usuario es premium o tiene sesiones gratuitas disponibles
    if (!req.user.premium && !req.user.subscription_active) {
      // Incrementar contador de sesiones usadas
      await User.increment('free_interview_sessions', { 
        by: 1, 
        where: { id: userId } 
      });
    }
    
    return res.json({ 
      success: true, 
      sessionId: `session_${Date.now()}`,
      message: "Sesión de entrevista iniciada correctamente" 
    });
  } catch (error) {
    logger.error('Error al iniciar sesión de entrevista', error);
    return res.status(500).json({ error: 'Error al iniciar sesión de entrevista' });
  }
};

// Generar pregunta de entrevista
exports.generateQuestion = (req, res) => {
  try {
    const { interviewType, conversation } = req.body;
    
    // Preguntas simuladas según el tipo de entrevista
    const questions = {
      'general': [
        "¿Podrías hablarme de tu experiencia profesional?",
        "¿Por qué te interesa este puesto?",
        "¿Cuáles son tus principales fortalezas?"
      ],
      'technical': [
        "Explica cómo funciona la herencia en programación orientada a objetos",
        "¿Qué es la complejidad algorítmica y por qué es importante?",
        "Describe la diferencia entre REST y GraphQL"
      ],
      'behavioral': [
        "Cuéntame sobre una situación difícil en tu trabajo y cómo la manejaste",
        "Describe un proyecto en el que hayas liderado un equipo",
        "¿Cómo manejas la presión y los plazos ajustados?"
      ]
    };
    
    // Seleccionar una pregunta aleatoria según el tipo
    const questionPool = questions[interviewType] || questions['general'];
    const randomQuestion = questionPool[Math.floor(Math.random() * questionPool.length)];
    
    return res.json({ 
      question: randomQuestion
    });
  } catch (error) {
    logger.error('Error al generar pregunta', error);
    return res.status(500).json({ error: 'Error al generar pregunta de entrevista' });
  }
};

// Analizar respuesta
exports.analyzeResponse = (req, res) => {
  try {
    const { response, question } = req.body;
    
    // Análisis simulado
    const analysis = {
      clarity: Math.floor(Math.random() * 5) + 1,
      relevance: Math.floor(Math.random() * 5) + 1,
      confidence: Math.floor(Math.random() * 5) + 1,
      suggestions: [
        "Considera proporcionar ejemplos más específicos",
        "Tu respuesta fue clara pero podría ser más concisa"
      ]
    };
    
    return res.json(analysis);
  } catch (error) {
    logger.error('Error al analizar respuesta', error);
    return res.status(500).json({ error: 'Error al analizar respuesta' });
  }
};

// Generar retroalimentación (premium)
exports.generateFeedback = (req, res) => {
  try {
    const { conversation } = req.body;
    
    // Retroalimentación simulada
    const feedback = {
      overallScore: Math.floor(Math.random() * 100),
      strengths: [
        "Buena comunicación de ideas complejas",
        "Respuestas estructuradas y concisas",
        "Comunicación clara y profesional"
      ],
      improvements: [
        "Podrías incluir más ejemplos específicos",
        "Algunas respuestas fueron demasiado generales",
        "Considera hablar más sobre tus habilidades técnicas"
      ],
      keyInsights: "Demuestras profesionalismo en tus respuestas. Para mejorar, enfócate en dar ejemplos más concretos y cuantificables de tus logros."
    };
    
    return res.json(feedback);
  } catch (error) {
    logger.error('Error al generar retroalimentación', error);
    return res.status(500).json({ error: 'Error al generar retroalimentación' });
  }
};

// Análisis avanzado (premium)
exports.advancedAnalysis = (req, res) => {
  try {
    const { sessionId } = req.body;
    
    // Análisis avanzado simulado
    const advancedAnalysis = {
      languagePatterns: {
        positiveLanguage: 72,
        technicalTerms: 14,
        fillerWords: 8
      },
      responseQuality: {
        completeness: 85,
        relevance: 92,
        structure: 78
      },
      improvementAreas: [
        {
          area: "Ejemplos concretos",
          description: "Añade más ejemplos cuantificables de tus logros"
        },
        {
          area: "Confianza",
          description: "Reduce palabras de relleno como 'um', 'eh', 'como que'"
        }
      ]
    };
    
    return res.json(advancedAnalysis);
  } catch (error) {
    logger.error('Error al generar análisis avanzado', error);
    return res.status(500).json({ error: 'Error al generar análisis avanzado' });
  }
};