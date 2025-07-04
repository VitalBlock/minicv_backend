const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const InterviewCategory = require('./InterviewCategory');
const InterviewSubcategory = require('./InterviewSubcategory');

const InterviewQuestion = sequelize.define('InterviewQuestion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'interview_categories',
      key: 'id'
    }
  },
  subcategoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'interview_subcategories',
      key: 'id'
    }
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  difficulty: {
    type: DataTypes.ENUM('basic', 'intermediate', 'advanced'),
    defaultValue: 'intermediate'
  },
  isPremium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'interview_questions',
  timestamps: true
});

// Establecer relaciones
InterviewCategory.hasMany(InterviewQuestion, { foreignKey: 'categoryId', as: 'questions' });
InterviewQuestion.belongsTo(InterviewCategory, { foreignKey: 'categoryId', as: 'category' });

InterviewSubcategory.hasMany(InterviewQuestion, { foreignKey: 'subcategoryId', as: 'questions' });
InterviewQuestion.belongsTo(InterviewSubcategory, { foreignKey: 'subcategoryId', as: 'subcategory' });

module.exports = InterviewQuestion;