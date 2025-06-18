const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const UserCV = sequelize.define('UserCV', {
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
    defaultValue: 'Mi CV'
  },
  template: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'professional'
  },
  cvData: {
    type: DataTypes.JSON,
    allowNull: false
  }
});

// Establecer relación con User
User.hasMany(UserCV, { foreignKey: 'userId' });
UserCV.belongsTo(User, { foreignKey: 'userId' });

module.exports = UserCV;