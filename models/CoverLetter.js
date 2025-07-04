const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const CoverLetter = sequelize.define('CoverLetter', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Mi Carta de Presentación'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  jobPosition: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  letterData: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'cover_letters',
  timestamps: true
});

// Establecer relación con User
User.hasMany(CoverLetter, { foreignKey: 'userId' });
CoverLetter.belongsTo(User, { foreignKey: 'userId' });

module.exports = CoverLetter;