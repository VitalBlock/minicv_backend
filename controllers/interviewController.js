const { Op } = require('sequelize');
const User = require('../models/User');
const logger = require('../utils/logger');

// Datos simulados de categorías
const categories = [
  { id: 'comportamentales', name: 'Comportamentales' },
  { id: 'tecnologia', name: 'Tecnología' },
  { id: 'ventas', name: 'Ventas' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'rrhh', name: 'Recursos Humanos' },
  { id: 'administracion', name: 'Administración' },
  { id: 'finanzas', name: 'Finanzas' },
  { id: 'salud', name: 'Salud' },
  { id: 'educacion', name: 'Educación' }
];

// Datos simulados de subcategorías
const subcategories = {
  comportamentales: [
    { id: 'sobre-ti', name: 'Sobre ti' },
    { id: 'experiencia', name: 'Experiencia' },
    { id: 'fortalezas', name: 'Fortalezas y debilidades' },
    { id: 'trabajo-equipo', name: 'Trabajo en equipo' },
    { id: 'manejo-estres', name: 'Manejo del estrés' }
  ],
  tecnologia: [
    { id: 'desarrollo-web', name: 'Desarrollo Web' },
    { id: 'desarrollo-movil', name: 'Desarrollo Móvil' },
    { id: 'data-science', name: 'Data Science' },
    { id: 'cloud', name: 'Cloud Computing' },
    { id: 'ciberseguridad', name: 'Ciberseguridad' }
  ],
  ventas: [
    { id: 'tecnicas', name: 'Técnicas de venta' },
    { id: 'resultados', name: 'Resultados y métricas' }
  ],
  marketing: [
    { id: 'digital', name: 'Marketing Digital' },
    { id: 'branding', name: 'Branding y Estrategia' }
  ],
  rrhh: [
    { id: 'seleccion', name: 'Selección de personal' },
    { id: 'desarrollo', name: 'Desarrollo profesional' }
  ],
  administracion: [
    { id: 'gestion', name: 'Gestión de proyectos' },
    { id: 'finanzas', name: 'Finanzas y presupuestos' }
  ],
  finanzas: [
    { id: 'analisis', name: 'Análisis financiero' },
    { id: 'contabilidad', name: 'Contabilidad' }
  ],
  salud: [
    { id: 'clinica', name: 'Práctica clínica' },
    { id: 'gestion', name: 'Gestión sanitaria' }
  ],
  educacion: [
    { id: 'docencia', name: 'Docencia' },
    { id: 'gestion', name: 'Gestión educativa' }
  ]
};

// Obtener categorías
exports.getCategories = (req, res) => {
  try {
    return res.json(categories);
  } catch (error) {
    logger.error('Error al obtener categorías de entrevista', error);
    return res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

// Obtener subcategorías
exports.getSubcategories = (req, res) => {
  try {
    const { category } = req.params;
    
    if (!subcategories[category]) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    
    return res.json(subcategories[category]);
  } catch (error) {
    logger.error('Error al obtener subcategorías', error);
    return res.status(500).json({ error: 'Error al obtener subcategorías' });
  }
};

// Obtener preguntas por categoría
exports.getQuestionsByCategory = (req, res) => {
  try {
    const { category } = req.params;
    // Implementación simulada
    // En una implementación real, obtendríamos las preguntas de la base de datos
    return res.json([
      { 
        id: 1, 
        question: "Háblame de ti", 
        answer: "Esta pregunta busca conocer tu trayectoria profesional de manera resumida.",
        isFrequent: true 
      },
      { 
        id: 2, 
        question: "¿Por qué quieres trabajar en nuestra empresa?", 
        answer: "Demuestra que has investigado la empresa."
      }
    ]);
  } catch (error) {
    logger.error('Error al obtener preguntas por categoría', error);
    return res.status(500).json({ error: 'Error al obtener preguntas' });
  }
};

// Obtener preguntas por subcategoría
exports.getQuestionsBySubcategory = (req, res) => {
  try {
    const { category, subcategory } = req.params;
    // Implementación simulada
    return res.json([
      { 
        id: 1, 
        question: "Háblame de ti", 
        answer: "Esta pregunta busca conocer tu trayectoria profesional de manera resumida.",
        isFrequent: true 
      }
    ]);
  } catch (error) {
    logger.error('Error al obtener preguntas por subcategoría', error);
    return res.status(500).json({ error: 'Error al obtener preguntas' });
  }
};

// Registrar vista de pregunta
exports.registerView = async (req, res) => {
  try {
    const userId = req.user.id;
    const { questionId } = req.body;
    
    // Actualizar contador de vistas para el usuario
    await User.increment('free_interview_views', { 
      by: 1, 
      where: { id: userId } 
    });
    
    return res.json({ success: true });
  } catch (error) {
    logger.error('Error al registrar vista de pregunta', error);
    return res.status(500).json({ error: 'Error al registrar vista' });
  }
};

// Obtener todas las preguntas (premium)
exports.getAllQuestions = (req, res) => {
  try {
    // Implementación simulada
    return res.json({
      comportamentales: {
        'sobre-ti': [
          { id: 1, question: "Háblame de ti", answer: "..." },
          { id: 2, question: "¿Por qué quieres trabajar en nuestra empresa?", answer: "..." }
        ]
      },
      tecnologia: {
        'desarrollo-web': [
          { id: 6, question: "Explica la diferencia entre JavaScript y Java", answer: "..." }
        ]
      }
    });
  } catch (error) {
    logger.error('Error al obtener todas las preguntas', error);
    return res.status(500).json({ error: 'Error al obtener preguntas' });
  }
};