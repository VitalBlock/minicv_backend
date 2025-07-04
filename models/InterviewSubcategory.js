const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const InterviewCategory = require('./InterviewCategory');

const InterviewSubcategory = sequelize.define('InterviewSubcategory', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'interview_subcategories',
  timestamps: true
});

// Establecer relación con Categoría
InterviewCategory.hasMany(InterviewSubcategory, { foreignKey: 'categoryId', as: 'subcategories' });
InterviewSubcategory.belongsTo(InterviewCategory, { foreignKey: 'categoryId', as: 'category' });

module.exports = InterviewSubcategory;