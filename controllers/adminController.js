const { User, Payment, UserCV } = require('../models');
const { Op } = require('sequelize');

// Obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }, // No enviar contraseñas
      order: [['createdAt', 'DESC']]
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// Obtener todos los pagos
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll({
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(payments);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
};

// Obtener estadísticas básicas
exports.getStatistics = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalCVs = await UserCV.count();
    const totalPayments = await Payment.count();
    const totalRevenue = await Payment.sum('amount');
    
    // Usuarios registrados en los últimos 7 días
    const newUsers = await User.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    // CVs creados en los últimos 7 días
    const newCVs = await UserCV.count({
      where: {
        createdAt: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });
    
    res.json({
      totalUsers,
      totalCVs,
      totalPayments,
      totalRevenue,
      newUsers,
      newCVs
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};