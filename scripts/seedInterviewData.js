require('dotenv').config();
const { sequelize } = require('../config/database');
const InterviewCategory = require('../models/InterviewCategory');
const InterviewSubcategory = require('../models/InterviewSubcategory');
const InterviewQuestion = require('../models/InterviewQuestion');
const logger = require('../utils/logger');

// Datos iniciales
const categories = [
  {
    name: 'Tecnología',
    description: 'Preguntas relacionadas con habilidades técnicas y conocimientos en tecnología',
    icon: 'computer',
    subcategories: [
      {
        name: 'Desarrollo Web',
        description: 'Frontend, Backend y Fullstack',
        questions: [
          {
            question: '¿Puedes explicar la diferencia entre let, const y var en JavaScript?',
            answer: 'var tiene alcance de función, mientras que let y const tienen alcance de bloque. const no permite reasignación, pero los objetos y arrays declarados con const pueden ser mutados.',
            difficulty: 'intermediate',
            isPremium: false
          },
          {
            question: '¿Qué es el Virtual DOM y cómo funciona en React?',
            answer: 'El Virtual DOM es una representación en memoria del DOM real. React crea y manipula esta representación, luego compara con el DOM real (diffing) y actualiza solo las partes que han cambiado (reconciliation), mejorando el rendimiento.',
            difficulty: 'intermediate',
            isPremium: false
          },
          {
            question: '¿Cómo implementarías autenticación JWT en una API REST?',
            answer: 'Crearía un endpoint para autenticación que genere tokens JWT firmados al validar credenciales. Implementaría middleware para verificar tokens en rutas protegidas, decodificando el payload para identificar al usuario.',
            difficulty: 'advanced',
            isPremium: true
          }
        ]
      },
      {
        name: 'Bases de Datos',
        description: 'SQL, NoSQL y optimización',
        questions: [
          {
            question: '¿Cuál es la diferencia entre una base de datos SQL y NoSQL?',
            answer: 'Las bases de datos SQL son relacionales, usan tablas estructuradas y esquemas rígidos. Las NoSQL son no relacionales, tienen esquemas flexibles y mejor escalabilidad horizontal. SQL usa lenguaje SQL estandarizado mientras NoSQL tiene APIs específicas.',
            difficulty: 'basic',
            isPremium: false
          },
          {
            question: 'Explica qué son los índices en bases de datos y cuándo utilizarlos',
            answer: 'Los índices son estructuras de datos que mejoran la velocidad de recuperación de datos a costa de espacio y rendimiento en operaciones de escritura. Se deben usar en columnas frecuentemente consultadas en cláusulas WHERE, ORDER BY o JOIN.',
            difficulty: 'intermediate',
            isPremium: false
          }
        ]
      }
    ]
  },
  {
    name: 'Habilidades Blandas',
    description: 'Preguntas sobre comunicación, trabajo en equipo y adaptabilidad',
    icon: 'people',
    subcategories: [
      {
        name: 'Trabajo en Equipo',
        description: 'Colaboración y resolución de conflictos',
        questions: [
          {
            question: 'Cuéntame sobre una situación en la que tuviste que resolver un conflicto en tu equipo',
            answer: 'Deberías describir una situación específica, explicar tu rol, las acciones que tomaste para facilitar la resolución, y el resultado positivo que se logró.',
            difficulty: 'intermediate',
            isPremium: false
          },
          {
            question: '¿Cómo manejas la situación cuando un miembro del equipo no está cumpliendo con su parte del trabajo?',
            answer: 'Un buen enfoque es primero hablar en privado con la persona para entender si hay algún obstáculo, ofrecer ayuda, y si no mejora, escalar apropiadamente manteniendo un enfoque constructivo.',
            difficulty: 'intermediate',
            isPremium: false
          }
        ]
      },
      {
        name: 'Liderazgo',
        description: 'Gestión de equipos y toma de decisiones',
        questions: [
          {
            question: 'Describe una situación en la que lideraste un proyecto difícil. ¿Cómo lo manejaste?',
            answer: 'Debes explicar el contexto del proyecto, los desafíos específicos, las estrategias que implementaste, cómo motivaste al equipo, y los resultados obtenidos, incluyendo lecciones aprendidas.',
            difficulty: 'advanced',
            isPremium: true
          }
        ]
      }
    ]
  },
  {
    name: 'Específicas del Puesto',
    description: 'Preguntas técnicas específicas para diferentes roles',
    icon: 'work',
    subcategories: [
      {
        name: 'Marketing Digital',
        description: 'SEO, SEM y estrategias de contenido',
        questions: [
          {
            question: '¿Cómo medirías el éxito de una campaña de marketing digital?',
            answer: 'Definiría KPIs claros como conversiones, ROI, tasa de clics, engagement, alcance y costo por adquisición. Utilizaría herramientas como Google Analytics y establecería un periodo base para comparar resultados.',
            difficulty: 'intermediate',
            isPremium: false
          }
        ]
      },
      {
        name: 'Recursos Humanos',
        description: 'Reclutamiento, selección y gestión del talento',
        questions: [
          {
            question: '¿Qué estrategias utilizas para evaluar si un candidato encaja con la cultura de la empresa?',
            answer: 'Combino preguntas situacionales basadas en valores de la empresa, involucro a miembros del equipo en el proceso, uso casos prácticos que reflejen desafíos reales, y evalúo consistencia entre diferentes entrevistas.',
            difficulty: 'intermediate',
            isPremium: false
          }
        ]
      }
    ]
  }
];

// Función para sembrar datos
async function seedData() {
  try {
    // Sincronizar modelos con la base de datos
    await sequelize.sync({ alter: true });
    logger.info('Modelos sincronizados');

    // Verificar si ya existen datos
    const categoryCount = await InterviewCategory.count();
    if (categoryCount > 0) {
      logger.info(`Ya existen ${categoryCount} categorías en la base de datos. Saltando proceso de sembrado.`);
      return;
    }

    // Crear categorías, subcategorías y preguntas
    for (const categoryData of categories) {
      const { subcategories, ...categoryFields } = categoryData;
      
      // Crear categoría
      const category = await InterviewCategory.create(categoryFields);
      logger.info(`Categoría creada: ${category.name}`);
      
      // Crear subcategorías para esta categoría
      for (const subcategoryData of subcategories) {
        const { questions, ...subcategoryFields } = subcategoryData;
        
        // Crear subcategoría
        const subcategory = await InterviewSubcategory.create({
          ...subcategoryFields,
          categoryId: category.id
        });
        logger.info(`Subcategoría creada: ${subcategory.name}`);
        
        // Crear preguntas para esta subcategoría
        if (questions && questions.length > 0) {
          const questionRecords = questions.map(q => ({
            ...q,
            categoryId: category.id,
            subcategoryId: subcategory.id
          }));
          
          await InterviewQuestion.bulkCreate(questionRecords);
          logger.info(`${questionRecords.length} preguntas creadas para ${subcategory.name}`);
        }
      }
    }
    
    logger.info('Proceso de sembrado completado con éxito');
  } catch (error) {
    logger.error('Error al sembrar datos:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('Datos de entrevista sembrados correctamente');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error al sembrar datos:', err);
      process.exit(1);
    });
}

module.exports = seedData;