// /c:/Users/bootc/minicv_backend/models/SavedCV.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const SavedCV = sequelize.define('SavedCV', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Mi CV'
  },
  template: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'professional'
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false
  }
}, {
  timestamps: true
});

// Establecer relación
User.hasMany(SavedCV, { foreignKey: 'userId', as: 'cvs' });
SavedCV.belongsTo(User, { foreignKey: 'userId' });

module.exports = SavedCV;