const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const QuestionView = sequelize.define('QuestionView', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, {
  tableName: 'question_views',
  timestamps: true
});

// Establecer relación con User
User.hasMany(QuestionView, { foreignKey: 'userId' });
QuestionView.belongsTo(User, { foreignKey: 'userId' });

module.exports = QuestionView;