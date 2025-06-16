const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mercadoPagoId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'approved', 'rejected', 'refunded']]
    }
  },
  template: {
    type: DataTypes.STRING,
    allowNull: true
  },
  downloadsRemaining: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'payments',
  timestamps: true
});

module.exports = Payment;