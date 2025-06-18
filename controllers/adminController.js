const User = require('../models/User');
const Payment = require('../models/Payment');
const UserCV = require('../models/UserCV');
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
    
    // Opcionalmente, podemos añadir información estadística
    const stats = {
      total: payments.length,
      approved: payments.filter(p => p.status === 'approved').length,
      pending: payments.filter(p => p.status === 'pending').length,
      rejected: payments.filter(p => p.status === 'rejected').length,
      totalRevenue: payments
        .filter(p => p.status === 'approved')
        .reduce((sum, p) => sum + Number(p.amount), 0)
    };
    
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

// Cambiar el rol de un usuario
exports.changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    // Validar que el rol sea válido
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }
    
    // Encontrar el usuario
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Actualizar el rol
    user.role = role;
    await user.save();
    
    res.json({ message: 'Rol actualizado correctamente', user });
  } catch (error) {
    console.error('Error al cambiar rol de usuario:', error);
    res.status(500).json({ error: 'Error al cambiar rol de usuario' });
  }
};