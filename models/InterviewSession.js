const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const InterviewSession = sequelize.define('InterviewSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  jobTitle: {
    type: DataTypes.STRING,
    allowNull: false
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  difficulty: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    defaultValue: 'intermediate'
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'abandoned'),
    defaultValue: 'active'
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER, // duración en segundos
    allowNull: true
  }
}, {
  tableName: 'interview_sessions',
  timestamps: true
});

// Establecer relación con User
User.hasMany(InterviewSession, { foreignKey: 'userId' });
InterviewSession.belongsTo(User, { foreignKey: 'userId' });

module.exports = InterviewSession;

// Establecer las relaciones después de exportar
const InterviewExchange = require('./InterviewExchange');
InterviewSession.hasMany(InterviewExchange, { foreignKey: 'sessionId', as: 'exchanges' });
InterviewExchange.belongsTo(InterviewSession, { foreignKey: 'sessionId', as: 'session' });