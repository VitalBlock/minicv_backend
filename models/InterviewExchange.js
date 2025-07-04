const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InterviewExchange = sequelize.define('InterviewExchange', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sessionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'interview_sessions',
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
  aiAnalysis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  questionNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'interview_exchanges',
  timestamps: true
});

module.exports = InterviewExchange;