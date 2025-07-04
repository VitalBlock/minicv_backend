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
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  position: {
    type: DataTypes.STRING,
    allowNull: true
  },
  recipient: {
    type: DataTypes.STRING,
    allowNull: true
  },
  toneStyle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true
  },
  customContent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  template: {
    type: DataTypes.STRING,
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