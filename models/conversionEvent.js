const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ConversionEvent = sequelize.define('ConversionEvent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  eventType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['page_view', 'template_selected', 'payment_initiated', 'payment_completed', 'payment_abandoned', 'pdf_downloaded']]
    }
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  template: {
    type: DataTypes.STRING,
    allowNull: true
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  referrer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
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
  tableName: 'conversion_events',
  timestamps: true
});

module.exports = ConversionEvent;