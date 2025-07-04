const axios = require('axios');
const logger = require('../utils/logger');

// Configuración de Hugging Face
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/';
const DEFAULT_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';

/**
 * Realiza una petición a la API de Hugging Face
 * @param {string} prompt - El texto de entrada para el modelo
 * @param {string} systemPrompt - Instrucciones de sistema (opcional)
 * @returns {Promise<string>} - La respuesta generada
 */
async function queryHuggingFace(prompt, systemPrompt = '') {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (!apiKey) {
      logger.error('HUGGINGFACE_API_KEY no está configurada');
      throw new Error('Configuración de API incompleta');
    }
    
    // Determinar qué modelo usar
    const model = process.env.HUGGINGFACE_MODEL || DEFAULT_MODEL;
    
    // Formato para modelos de chat tipo Mistral
    const fullPrompt = systemPrompt 
      ? `<s>[INST] ${systemPrompt} [/INST]</s>\n<s>[INST] ${prompt} [/INST]</s>`
      : `<s>[INST] ${prompt} [/INST]</s>`;
    
    // Hacer la solicitud a Hugging Face
    const response = await axios.post(
      `${HUGGINGFACE_API_URL}${model}`,
      { 
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          return_full_text: false
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    // Extraer la respuesta
    // La API de Hugging Face puede devolver diferentes formatos según el modelo
    let result = '';
    if (Array.isArray(response.data) && response.data.length > 0) {
      // Formato de respuesta más común
      result = response.data[0].generated_text;
    } else if (typeof response.data === 'string') {
      // Algunos modelos devuelven directamente un string
      result = response.data;
    } else if (response.data && response.data.generated_text) {
      // Otro formato posible
      result = response.data.generated_text;
    }
    
    return result.trim();
  } catch (error) {
    logger.error('Error al comunicarse con Hugging Face API', error);
    throw new Error('Error en la comunicación con el servicio de IA: ' + (error.message || 'Error desconocido'));
  }
}

// Función para generar una pregunta de entrevista
exports.generateInterviewQuestion = async (jobTitle, industry, difficulty, previousQuestions = []) => {
  try {
    // Preparar mensaje para la API
    const prompt = `Actúa como un entrevistador para el puesto de "${jobTitle}" ${industry ? `en la industria de ${industry}` : ''}.
    
    Genera una pregunta de entrevista de nivel ${difficulty} que sea relevante para el puesto.
    
    ${previousQuestions.length > 0 ? `Preguntas anteriores en esta entrevista (evita repetir):
    ${previousQuestions.join('\n')}` : ''}
    
    La pregunta debe ser específica, retadora y relevante para evaluar las habilidades del candidato para este puesto.
    No hagas introducciones ni explicaciones, solo la pregunta.`;
    
    const systemPrompt = 'Eres un entrevistador profesional experto en recursos humanos que genera preguntas concisas y relevantes.';
    
    // Obtener respuesta de Hugging Face
    const question = await queryHuggingFace(prompt, systemPrompt);
    
    return question;
  } catch (error) {
    logger.error('Error al generar pregunta de entrevista', error);
    throw new Error('No se pudo generar la pregunta de entrevista');
  }
};

// Función para analizar la respuesta del usuario
exports.analyzeAnswer = async (jobTitle, question, answer, difficulty) => {
  try {
    // Preparar mensaje para la API
    const prompt = `Analiza esta respuesta de entrevista de trabajo:
    
    Puesto: "${jobTitle}"
    Pregunta: "${question}"
    Respuesta del candidato: "${answer}"
    Nivel de dificultad: ${difficulty}
    
    Evalúa la respuesta según estos criterios:
    1. Relevancia y precisión
    2. Claridad y estructura
    3. Demostración de experiencia
    4. Adecuación al nivel de dificultad
    
    Responde exactamente con este formato:
    Puntuación: [un número del 1 al 10]
    Análisis: [tu análisis detallado]`;
    
    const systemPrompt = 'Eres un evaluador profesional de entrevistas de trabajo. Debes dar una puntuación numérica del 1 al 10 y un análisis constructivo.';
    
    // Obtener respuesta de Hugging Face
    const analysisText = await queryHuggingFace(prompt, systemPrompt);
    
    // Extraer puntuación
    const scoreMatch = analysisText.match(/Puntuación:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;
    
    // Asegurar que la puntuación esté en el rango correcto
    const validScore = Math.min(Math.max(score, 1), 10);
    
    return {
      analysis: analysisText,
      score: validScore
    };
  } catch (error) {
    logger.error('Error al analizar respuesta', error);
    throw new Error('No se pudo analizar la respuesta');
  }
};

// Función para generar retroalimentación final
exports.generateFinalFeedback = async (jobTitle, exchanges) => {
  try {
    // Preparar mensaje para la API
    const prompt = `Genera una retroalimentación final para una entrevista de trabajo para el puesto de "${jobTitle}".
    
    Detalles de la entrevista:
    ${exchanges.map((exchange, index) => `
    Pregunta ${index + 1}: "${exchange.question}"
    Respuesta: "${exchange.answer}"
    Análisis: "${exchange.aiAnalysis}"
    Puntuación: ${exchange.score}/10
    `).join('\n')}
    
    Incluye en tu retroalimentación:
    1. Fortalezas demostradas
    2. Áreas de mejora
    3. Recomendaciones específicas
    4. Evaluación general de idoneidad
    
    Tu retroalimentación debe ser constructiva y específica.`;
    
    const systemPrompt = 'Eres un entrevistador profesional que proporciona retroalimentación constructiva y detallada después de una entrevista de trabajo.';
    
    // Obtener respuesta de Hugging Face
    const feedback = await queryHuggingFace(prompt, systemPrompt);
    
    // Calcular puntuación promedio
    const totalScore = exchanges.reduce((sum, exchange) => sum + (exchange.score || 0), 0);
    const averageScore = Math.round(totalScore / exchanges.length);
    
    return {
      feedback,
      score: averageScore
    };
  } catch (error) {
    logger.error('Error al generar retroalimentación final', error);
    throw new Error('No se pudo generar la retroalimentación final');
  }
};

// Función para generar una carta de presentación
exports.generateCoverLetter = async (userData, jobDetails) => {
  try {
    const { name, experience, skills, education } = userData;
    const { position, company, requirements } = jobDetails;
    
    const prompt = `Genera una carta de presentación profesional para ${name} que está aplicando al puesto de ${position} en ${company}.
    
    Información del candidato:
    - Experiencia: ${experience}
    - Habilidades: ${skills}
    - Educación: ${education}
    
    Requisitos del puesto:
    ${requirements}
    
    La carta debe ser profesional, concisa y destacar cómo la experiencia y habilidades del candidato se alinean con los requisitos del puesto.
    Debe tener un formato estándar con saludo, cuerpo y cierre.`;
    
    const systemPrompt = 'Eres un experto en redacción de cartas de presentación profesionales que conectan efectivamente las cualidades del candidato con los requisitos del puesto.';
    
    // Obtener respuesta de Hugging Face
    const coverLetter = await queryHuggingFace(prompt, systemPrompt);
    
    return coverLetter;
  } catch (error) {
    logger.error('Error al generar carta de presentación', error);
    throw new Error('No se pudo generar la carta de presentación');
  }
};