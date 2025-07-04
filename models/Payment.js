const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User'); 

const Payment = sequelize.define('Payment', {
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
    allowNull: false,
    validate: {
      isIn: [['professional', 'modern', 'creative', 'minimalist', 
              'chronological', 'executive', 'international', 'academic',
              'mixed', 'functional', 'cover-letter', 'interview-questions', 
              'interview-simulator', 'premium-bundle']]
    }
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

// Establecer relación con User si no existe
if (User) {
  User.hasMany(Payment, { foreignKey: 'userId' });
  Payment.belongsTo(User, { foreignKey: 'userId' });
}

module.exports = Payment;