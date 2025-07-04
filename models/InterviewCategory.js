const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InterviewCategory = sequelize.define('InterviewCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'interview_categories',
  timestamps: true
});

module.exports = InterviewCategory;