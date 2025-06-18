// /c:/Users/bootc/minicv_backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');

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
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'none' : 'lax'
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
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'none' : 'lax'
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
      email: user.email
    });
  } catch (error) {
    logger.error('Error en login de usuario', error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// Cerrar sesión
exports.logout = async (req, res) => {
  res.clearCookie('token');
  res.clearCookie('sessionId');
  return res.status(200).json({ message: 'Sesión cerrada correctamente' });
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