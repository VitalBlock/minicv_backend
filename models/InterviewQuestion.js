const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const InterviewSession = require('./InterviewSession');

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
    type: DataTypes.INTEGER, // 1-10
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

// Establecer relación con Session
InterviewSession.hasMany(InterviewExchange, { foreignKey: 'sessionId', as: 'exchanges' });
InterviewExchange.belongsTo(InterviewSession, { foreignKey: 'sessionId', as: 'session' });

module.exports = InterviewExchange;