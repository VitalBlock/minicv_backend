// /c:/Users/bootc/minicv_backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');
const { Op } = require('sequelize');

// Generar token JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: '30d'
  });
};

// Registro de usuario
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validar datos
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    
    // Verificar si el email ya existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Este correo ya está registrado' });
    }
    
    // Crear el usuario
    const user = await User.create({
      name,
      email,
      password,
      lastLogin: new Date()
    });
    
    // Si hay una sesión activa, asociar los pagos con el nuevo usuario
    const sessionId = req.cookies.sessionId;
    if (sessionId) {
      await Payment.update(
        { userId: user.id },
        { where: { sessionId: sessionId } }
      );
    }
    
    // Generar token
    const token = generateToken(user.id);
    
    // Configurar cookie segura con el token
    res.cookie('token', token, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      httpOnly: true,
      secure: true, // Siempre debe ser true cuando sameSite es 'none'
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    
    // Responder con datos del usuario (sin contraseña)
    return res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    logger.error('Error al registrar usuario', error);
    return res.status(500).json({ error: 'Error al crear la cuenta' });
  }
};

// Login de usuario
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar datos
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }
    
    // Buscar usuario
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();
    
    // Generar token
    const token = generateToken(user.id);
    
    // Configurar cookie segura con el token
    res.cookie('token', token, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      httpOnly: true,
      secure: true, // Siempre debe ser true cuando sameSite es 'none'
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    
    // Si hay una sesión activa, asociar los pagos con el usuario
    const sessionId = req.cookies.sessionId;
    if (sessionId) {
      await Payment.update(
        { userId: user.id },
        { where: { sessionId: sessionId, userId: null } }
      );
    }
    
    // Responder con datos del usuario
    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user' // Asegurarse de incluir el rol
    });
  } catch (error) {
    logger.error('Error en login de usuario', error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// Cerrar sesión
exports.logout = async (req, res) => {
  try {
    // Eliminar la cookie del token - usar opciones idénticas a las usadas al crearla
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'  // Asegúrate de que la ruta coincida con la usada al crear la cookie
    });
    
    // También eliminar sessionId si existe
    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });
    
    // Invalidar la sesión si estás usando sesiones
    if (req.session) {
      req.session.destroy();
    }
    
    res.status(200).json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};

// Obtener datos del usuario actual
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    logger.error('Error al obtener usuario actual', error);
    return res.status(500).json({ error: 'Error al obtener información del usuario' });
  }
};

// Actualizar perfil de usuario
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;
    
    // Validar datos
    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    // Si se intenta cambiar el email, verificar que no esté en uso
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'El correo electrónico ya está en uso' });
      }
    }
    
    // Buscar usuario
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Actualizar datos
    user.name = name;
    if (email) user.email = email;
    
    await user.save();
    
    // Devolver usuario actualizado sin la contraseña
    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      createdAt: user.createdAt
    });
  } catch (error) {
    logger.error('Error al actualizar perfil de usuario', error);
    return res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Validar datos
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }
    
    // Buscar usuario
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Verificar contraseña actual
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }
    
    // Actualizar contraseña
    user.password = newPassword;
    await user.save();
    
    return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    logger.error('Error al cambiar contraseña', error);
    return res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};

// Eliminar cuenta
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;
    
    // Validar datos
    if (!password) {
      return res.status(400).json({ error: 'La contraseña es requerida' });
    }
    
    // Buscar usuario
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }
    
    // Eliminar CVs del usuario
    await UserCV.destroy({ where: { userId } });
    
    // Eliminar usuario
    await user.destroy();
    
    // Eliminar cookies
    res.clearCookie('token');
    res.clearCookie('sessionId');
    
    return res.status(200).json({ message: 'Cuenta eliminada correctamente' });
  } catch (error) {
    logger.error('Error al eliminar cuenta', error);
    return res.status(500).json({ error: 'Error al eliminar cuenta' });
  }
};

// Añadir este método al controlador de autenticación
exports.checkSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar suscripción activa en la base de datos
    const subscription = await Payment.findOne({
      where: {
        userId,
        isSubscription: true,
        status: 'approved',
        subscriptionEndDate: {
          [Op.gt]: new Date() // Fecha fin mayor que hoy
        }
      },
      order: [['subscriptionEndDate', 'DESC']]
    });
    
    return res.json({
      active: !!subscription,
      subscription: subscription || null
    });
  } catch (error) {
    console.error('Error al verificar suscripción:', error);
    return res.status(500).json({ error: 'Error al verificar suscripción' });
  }
};