// Importación correcta al inicio
const mercadopago = require('mercadopago');
const logger = require('../utils/logger');
const Payment = require('../models/Payment');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize'); // Cambia esto
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserCV = require('../models/UserCV'); // Asegúrate de tener este modelo

// Configuración de MercadoPago
mercadopago.configure({
  access_token: config.mercadoPago.accessToken
});

// Crear preferencia de pago
exports.createPreference = async (req, res) => {
  try {
    const { title, price, quantity, template, isSubscription, productType } = req.body;
    
    // Añadir estos logs de diagnóstico
    console.log("Headers recibidos:", req.headers);
    console.log("Cookies recibidas:", req.cookies);
    console.log("Usuario autenticado:", req.user ? {id: req.user.id, email: req.user.email} : 'No autenticado');
    console.log("Datos del body:", req.body);
    
    // Verificar si el usuario está autenticado (para compras que lo requieren)
    if (isSubscription && !req.user) {
      return res.status(401).json({ 
        error: 'Debes iniciar sesión para adquirir una suscripción',
        requiresAuth: true 
      });
    }
    
    // Validación básica
    if (!price) {
      return res.status(400).json({ error: 'Precio no válido' });
    }
    
    // Configuración básica para la preferencia
    const preferenceData = {
      items: [{
        title: title || 'CV Premium',
        unit_price: parseInt(price),
        quantity: 1,
        currency_id: 'COP'
      }],
      back_urls: {
        success: `${config.frontendUrl}/payment/mercadopago/success`,
        failure: `${config.frontendUrl}/payment/mercadopago/failure`,
        pending: `${config.frontendUrl}/payment/mercadopago/pending`
      },
      notification_url: `${config.backendUrl}/api/mercadopago/webhook`, // Añadir esta línea
      auto_return: 'approved',
      statement_descriptor: 'MiniCV Premium'
    };
    
    // Crear preferencia directamente sin lógica compleja
    const response = await mercadopago.preferences.create(preferenceData);
    
    // Registrar en base de datos básico
    await Payment.create({
      sessionId: req.cookies.sessionId || `session_${Date.now()}`,
      mercadoPagoId: response.body.id,
      amount: parseInt(price),
      status: 'pending',
      template: isSubscription ? 'premium-bundle' : (template || 'professional'),
      isSubscription: !!isSubscription
    });
    
    return res.status(201).json({
      id: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point
    });
  } catch (error) {
    console.error('Error detallado al crear preferencia:', error);
    return res.status(500).json({ 
      error: 'Error al crear la preferencia de pago',
      details: error.message 
    });
  }
};

// Nuevo endpoint para verificar el estado de descargas
exports.checkUserPayment = async (req, res) => {
  try {
    const { template } = req.params;
    const sessionId = req.cookies.sessionId;
    
    if (!sessionId) {
      return res.status(200).json({ hasPaid: false });
    }
    
    // Buscar pago aprobado con descargas disponibles
    const payment = await Payment.findOne({
      where: {
        sessionId: sessionId,
        template: template,
        status: 'approved',
        downloadsRemaining: { [Op.gt]: 0 } // Cambia a:
        // downloadsRemaining: { gt: 0 }
      }
    });
    
    return res.status(200).json({
      hasPaid: !!payment,
      downloadsRemaining: payment ? payment.downloadsRemaining : 0,
      paymentInfo: payment ? {
        id: payment.mercadoPagoId,
        date: payment.updatedAt
      } : null
    });
  } catch (error) {
    logger.error('Error al verificar pago de usuario', error);
    return res.status(500).json({ error: 'Error al verificar pago' });
  }
};

// Verificar pago de usuario sin especificar template
exports.checkUserPaymentGeneral = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    
    if (!sessionId) {
      return res.status(200).json({ hasPaid: false });
    }
    
    // Buscar cualquier pago aprobado con descargas disponibles
    const payment = await Payment.findOne({
      where: {
        sessionId: sessionId,
        status: 'approved',
        downloadsRemaining: { [Op.gt]: 0 } // Cambia a:
        // downloadsRemaining: { gt: 0 }
      },
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      hasPaid: !!payment,
      downloadsRemaining: payment ? payment.downloadsRemaining : 0,
      template: payment ? payment.template : null,
      paymentInfo: payment ? {
        id: payment.mercadoPagoId,
        date: payment.updatedAt
      } : null
    });
  } catch (error) {
    logger.error('Error al verificar pago general de usuario', error);
    return res.status(500).json({ error: 'Error al verificar pago' });
  }
};

// Nuevo endpoint para registrar una descarga
exports.registerDownload = async (req, res) => {
  try {
    const { template } = req.params;
    const sessionId = req.cookies.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'No hay sesión activa' });
    }
    
    // Buscar el pago más reciente con descargas disponibles
    const payment = await Payment.findOne({
      where: {
        sessionId: sessionId,
        template: template,
        status: 'approved',
        downloadsRemaining: { [Op.gt]: 0 } // Cambia a:
        // downloadsRemaining: { gt: 0 }
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (!payment) {
      return res.status(400).json({ 
        error: 'No hay descargas disponibles',
        requiresPayment: true
      });
    }
    
    // Decrementar contador de descargas
    payment.downloadsRemaining -= 1;
    await payment.save();
    
    logger.info('Descarga registrada', { 
      sessionId, 
      template, 
      remainingDownloads: payment.downloadsRemaining 
    });
    
    return res.status(200).json({
      success: true,
      downloadsRemaining: payment.downloadsRemaining
    });
  } catch (error) {
    logger.error('Error al registrar descarga', error);
    return res.status(500).json({ error: 'Error al registrar descarga' });
  }
};

// Actualizar el webhook para guardar el estado del pago
exports.handleWebhook = async (req, res) => {
  try {
    console.log('Webhook recibido:', JSON.stringify(req.body, null, 2));

    const { action, data, type } = req.body;
    let paymentId = null;

    // Compatibilidad con diferentes formatos de webhook
    if (data && data.id) {
      paymentId = data.id;
    } else if (req.body['data.id']) {
      paymentId = req.body['data.id'];
    }

    if (
      action === 'payment.updated' ||
      action === 'payment.created' ||
      type === 'payment' ||
      req.body.topic === 'payment'
    ) {
      if (!paymentId) {
        console.error('No se encontró paymentId en el webhook');
        return res.status(400).json({ error: 'No paymentId in webhook' });
      }

      // Obtener información detallada del pago desde MercadoPago
      const mercadopagoPayment = await mercadopago.payment.findById(paymentId);

      if (mercadopagoPayment.body) {
        const payment = mercadopagoPayment.body;

        // Actualizar el estado y otros campos relevantes en la base de datos
        const [updatedRows] = await Payment.update(
          {
            status: payment.status,
            status_detail: payment.status_detail,
            payment_type_id: payment.payment_type_id,
            payment_method_id: payment.payment_method_id,
            payer_email: payment.payer && payment.payer.email,
            updatedAt: new Date()
          },
          {
            where: { mercadoPagoId: payment.id.toString() }
          }
        );

        if (updatedRows > 0) {
          console.log(`Pago ${payment.id} actualizado a estado: ${payment.status}`);
        } else {
          console.warn(`No se encontró el pago con mercadoPagoId: ${payment.id}`);
        }
      } else {
        console.warn('No se encontró información del pago en MercadoPago');
      }
    } else {
      console.log('Evento ignorado por el webhook:', action || type || req.body.topic);
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error en webhook de MercadoPago:', error);
    return res.status(500).json({ error: 'Error processing webhook' });
  }
};

// Verificar pago de usuario sin especificar template
exports.checkUserPaymentGeneral = async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    
    if (!sessionId) {
      return res.status(200).json({ hasPaid: false });
    }
    
    // Buscar cualquier pago aprobado con descargas disponibles
    const payment = await Payment.findOne({
      where: {
        sessionId: sessionId,
        status: 'approved',
        downloadsRemaining: { [Op.gt]: 0 } // Cambia a:
        // downloadsRemaining: { gt: 0 }
      },
      order: [['createdAt', 'DESC']]
    });
    
    return res.status(200).json({
      hasPaid: !!payment,
      downloadsRemaining: payment ? payment.downloadsRemaining : 0,
      template: payment ? payment.template : null,
      paymentInfo: payment ? {
        id: payment.mercadoPagoId,
        date: payment.updatedAt
      } : null
    });
  } catch (error) {
    logger.error('Error al verificar pago general de usuario', error);
    return res.status(500).json({ error: 'Error al verificar pago' });
  }
};

// Nuevo endpoint para registrar una descarga
exports.registerDownload = async (req, res) => {
  try {
    const { template } = req.params;
    const sessionId = req.cookies.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'No hay sesión activa' });
    }
    
    // Buscar el pago más reciente con descargas disponibles
    const payment = await Payment.findOne({
      where: {
        sessionId: sessionId,
        template: template,
        status: 'approved',
        downloadsRemaining: { [Op.gt]: 0 } // Cambia a:
        // downloadsRemaining: { gt: 0 }
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (!payment) {
      return res.status(400).json({ 
        error: 'No hay descargas disponibles',
        requiresPayment: true
      });
    }
    
    // Decrementar contador de descargas
    payment.downloadsRemaining -= 1;
    await payment.save();
    
    logger.info('Descarga registrada', { 
      sessionId, 
      template, 
      remainingDownloads: payment.downloadsRemaining 
    });
    
    return res.status(200).json({
      success: true,
      downloadsRemaining: payment.downloadsRemaining
    });
  } catch (error) {
    logger.error('Error al registrar descarga', error);
    return res.status(500).json({ error: 'Error al registrar descarga' });
  }
};

// Actualizar el webhook para guardar el estado del pago
exports.handleWebhook = async (req, res) => {
  try {
    console.log('Webhook recibido:', JSON.stringify(req.body, null, 2));

    const { action, data, type } = req.body;
    let paymentId = null;

    // Compatibilidad con diferentes formatos de webhook
    if (data && data.id) {
      paymentId = data.id;
    } else if (req.body['data.id']) {
      paymentId = req.body['data.id'];
    }

    if (
      action === 'payment.updated' ||
      action === 'payment.created' ||
      type === 'payment' ||
      req.body.topic === 'payment'
    ) {
      if (!paymentId) {
        console.error('No se encontró paymentId en el webhook');
        return res.status(400).json({ error: 'No paymentId in webhook' });
      }

      // Obtener información detallada del pago desde MercadoPago
      const mercadopagoPayment = await mercadopago.payment.findById(paymentId);

      if (mercadopagoPayment.body) {
        const payment = mercadopagoPayment.body;

        // Actualizar el estado y otros campos relevantes en la base de datos
        const [updatedRows] = await Payment.update(
          {
            status: payment.status,
            status_detail: payment.status_detail,
            payment_type_id: payment.payment_type_id,
            payment_method_id: payment.payment_method_id,
            payer_email: payment.payer && payment.payer.email,
            updatedAt: new Date()
          },
          {
            where: { mercadoPagoId: payment.id.toString() }
          }
        );

        if (updatedRows > 0) {
          console.log(`Pago ${payment.id} actualizado a estado: ${payment.status}`);
        } else {
          console.warn(`No se encontró el pago con mercadoPagoId: ${payment.id}`);
        }
      } else {
        console.warn('No se encontró información del pago en MercadoPago');
      }
    } else {
      console.log('Evento ignorado por el webhook:', action || type || req.body.topic);
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error en webhook de MercadoPago:', error);
    return res.status(500).json({ error: 'Error processing webhook' });
  }
};

// Verificar el estado de un pago
exports.checkPayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    const paymentInfo = await mercadopago.payment.findById(id);
    
    if (!paymentInfo || !paymentInfo.body) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    return res.status(200).json(paymentInfo.body);
  } catch (error) {
    logger.error('Error al verificar estado del pago', error);
    return res.status(500).json({ error: 'Error al verificar el pago' });
  }
};

// Obtener la clave pública
exports.getPublicKey = async (req, res) => {
  return res.status(200).json({ 
    publicKey: config.mercadoPago.publicKey
  });
};

// Inicializar sesión para usuario
exports.initializeSession = async (req, res) => {
  try {
    // Generar un ID de sesión nuevo si no existe
    const sessionId = req.cookies.sessionId || uuidv4();
    
    // Establecer cookie de sesión
    res.cookie('sessionId', sessionId, { 
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'none' : 'lax'
    });
    
    return res.status(200).json({ 
      success: true, 
      sessionId,
      message: 'Sesión inicializada correctamente'
    });
  } catch (error) {
    logger.error('Error al inicializar sesión', error);
    return res.status(500).json({ error: 'Error al inicializar sesión' });
  }
};

// Añadir este nuevo endpoint al final del archivo
exports.createSubscriptionProxy = async (req, res) => {
  try {
    // Obtener el token directamente del header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token no proporcionado',
        requiresAuth: true
      });
    }
    
    // Extraer el token
    const token = authHeader.substring(7);
    
    // Validar el token manualmente
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      
      // Buscar el usuario directamente
      const user = await User.findByPk(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          error: 'Usuario no encontrado',
          requiresAuth: true
        });
      }
      
      // Asignar el usuario al request
      req.user = user;
      
      // Continuar con la creación de la preferencia
      const { title, price } = req.body;
      
      // Configuración básica para la preferencia
      const preferenceData = {
        items: [{
          title: title || 'Suscripción MiniCV',
          unit_price: parseInt(price || 15000),
          quantity: 1,
          currency_id: 'COP'
        }],
        back_urls: {
          success: `${config.frontendUrl}/payment/mercadopago/success`,
          failure: `${config.frontendUrl}/payment/mercadopago/failure`,
          pending: `${config.frontendUrl}/payment/mercadopago/pending`
        },
        notification_url: `${config.backendUrl}/api/mercadopago/webhook`, // Añadir esta línea
        auto_return: 'approved',
        statement_descriptor: 'MiniCV Premium',
        external_reference: 'premium-bundle'
      };
      
      // Crear la preferencia
      const response = await mercadopago.preferences.create(preferenceData);
      
      // Registrar en base de datos
      await Payment.create({
        userId: user.id,
        sessionId: req.cookies.sessionId || `session_${Date.now()}`,
        mercadoPagoId: response.body.id,
        amount: parseInt(price || 15000),
        status: 'pending',
        template: 'premium-bundle',
        isSubscription: true
      });
      
      return res.status(201).json({
        id: response.body.id,
        init_point: response.body.init_point,
        sandbox_init_point: response.body.sandbox_init_point
      });
      
    } catch (tokenError) {
      console.error('Error al verificar token:', tokenError);
      return res.status(401).json({
        error: 'Token inválido',
        requiresAuth: true
      });
    }
  } catch (error) {
    console.error('Error en proxy de suscripción:', error);
    return res.status(500).json({
      error: 'Error al procesar la solicitud',
      details: error.message
    });
  }
};

// En mercadoPagoController.js - Agregar este nuevo método

exports.registerPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentId, status, template, amount, cvData } = req.body;
    
    console.log("Registrando pago:", { 
      userId, paymentId, status, template, 
      amountReceived: amount,
      hasCvData: !!cvData
    });
    
    // Validar datos mínimos
    if (!paymentId || !status) {
      return res.status(400).json({ 
        success: false, 
        error: 'Datos incompletos para registrar el pago' 
      });
    }
    
    // Registrar el pago en la base de datos
    const newPayment = await Payment.create({
      userId,
      mercadoPagoId: paymentId,
      status,
      amount: amount || 0,
      template: template || 'professional',
      downloadsRemaining: 5, // Establecer explícitamente 5 descargas
      sessionId: req.cookies.sessionId || `session_${Date.now()}`
    });
    
    // Si el pago es para una suscripción, actualizar al usuario
    if (template === 'premium-bundle' || template === 'interview-pack') {
      const user = await User.findByPk(userId);
      if (user) {
        user.premium = true;
        user.premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
        await user.save();
      }
    }
    
    // Si el pago incluye datos del CV, guardarlo en el perfil del usuario
    if (cvData && Object.keys(cvData).length > 0) {
      try {
        await UserCV.create({
          userId,
          name: `CV Premium - ${template || 'Profesional'}`,
          template: template || 'professional',
          cvData,
          isPremium: true // Marcar como CV premium
        });
      } catch (cvError) {
        console.error('Error al guardar CV premium:', cvError);
      }
    }
    
    console.log("Pago registrado exitosamente:", newPayment.id);
    
    return res.status(201).json({
      success: true,
      message: 'Pago registrado correctamente',
      payment: newPayment,
      downloadsRemaining: 5
    });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al registrar el pago'
    });
  }
};

// Modificar getUserPremiumTemplates para mayor precisión

exports.getUserPremiumTemplates = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar solo los pagos APROBADOS del usuario
    const payments = await Payment.findAll({
      where: {
        userId,
        status: 'approved'  // Solo mostrar los aprobados
      },
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`Encontrados ${payments.length} pagos aprobados para el usuario ${userId}`);
    
    // Transformar los pagos en un formato más amigable
    const templates = payments.map(payment => ({
      id: payment.id,
      template: payment.template,
      downloadsRemaining: payment.downloadsRemaining || 5,
      purchaseDate: payment.createdAt,
      isSubscription: payment.isSubscription || false,
      status: payment.status
    }));
    
    return res.status(200).json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error al obtener plantillas premium:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener plantillas premium'
    });
  }
};

// Endpoint de diagnóstico - Añadir al controlador
exports.checkUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Obtener todos los pagos del usuario
    const payments = await Payment.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });
    
    // Obtener datos básicos del usuario sin depender de columnas que pueden no existir
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email']
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Determinar si es premium basado en los pagos aprobados
    const hasApprovedPayment = payments.some(p => p.status === 'approved');
    
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        // Generar estas propiedades en vez de leerlas de la DB
        premium: hasApprovedPayment,
        premiumUntil: hasApprovedPayment ? new Date(Date.now() + 30*24*60*60*1000) : null
      },
      payments: payments.map(p => ({
        id: p.id,
        mercadoPagoId: p.mercadoPagoId,
        status: p.status,
        amount: p.amount,
        template: p.template,
        downloadsRemaining: p.downloadsRemaining,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    console.error('Error al verificar pagos:', error);
    return res.status(500).json({ error: 'Error al verificar pagos' });
  }
};

// Nuevo endpoint en el controlador de MercadoPago
exports.activatePendingPayments = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }
    
    const userId = req.user.id;
    
    console.log(`Intentando activar pagos pendientes para usuario ${userId}`);
    
    // Buscar todos los pagos pendientes del usuario
    const pendingPayments = await Payment.findAll({
      where: {
        userId,
        status: 'pending'
      }
    });
    
    console.log(`Encontrados ${pendingPayments.length} pagos pendientes`);
    
    if (pendingPayments.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No hay pagos pendientes para activar',
        activatedPayments: []
      });
    }
    
    // Activar solo pagos confirmados en MercadoPago
    const activatedPayments = [];
    let errorOccurred = false;
    
    for (const payment of pendingPayments) {
      try {
        // Verificar con MercadoPago si el pago realmente se completó
        if (payment.mercadoPagoId) {
          try {
            const mpPayment = await mercadopago.payment.get(payment.mercadoPagoId);
            
            // Solo activar si MercadoPago confirma que está aprobado
            if (mpPayment.response.status === 'approved') {
              payment.status = 'approved';
              await payment.save();
              console.log(`Pago ${payment.id} activado correctamente (verificado con MercadoPago)`);
              activatedPayments.push({
                id: payment.id,
                template: payment.template,
                amount: payment.amount
              });
            } else {
              console.log(`Pago ${payment.id} no activado: estado en MercadoPago = ${mpPayment.response.status}`);
            }
          } catch (mpError) {
            console.error(`Error al verificar pago ${payment.id} en MercadoPago:`, mpError);
            errorOccurred = true;
          }
        } else {
          console.log(`Pago ${payment.id} no tiene ID de MercadoPago, no se puede verificar`);
        }
      } catch (saveError) {
        errorOccurred = true;
        console.error(`Error al activar pago ${payment.id}:`, saveError);
      }
    }
    
    // Intentar actualizar el estado premium del usuario si se activó algún pago
    if (activatedPayments.length > 0) {
      try {
        // Actualizar estado premium del usuario
        await User.update(
          {
            premium: true,
            premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
          },
          { where: { id: userId } }
        );
        console.log(`Estado premium actualizado para usuario ${userId}`);
      } catch (userUpdateError) {
        console.error(`Error al actualizar estado premium del usuario ${userId}:`, userUpdateError);
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `${activatedPayments.length} pagos activados correctamente` + 
               (errorOccurred ? " (algunos pagos no pudieron verificarse)" : ""),
      activatedPayments
    });
  } catch (error) {
    console.error('Error al activar pagos pendientes:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al activar pagos pendientes',
      details: error.message
    });
  }
};
// Añadir este controlador al final del archivo

exports.createTestPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { template = 'professional', amount = 3000 } = req.body;
    
    console.log(`Creando pago de prueba para usuario ${userId}, plantilla ${template}`);
    
    // Crear un pago de prueba con estado aprobado
    const payment = await Payment.create({
      userId,
      sessionId: `test_session_${Date.now()}`,
      mercadoPagoId: `test_mp_${Date.now()}`,
      amount: amount,
      status: 'approved',
      template: template,
      downloadsRemaining: 5,
      purchaseDate: new Date()
    });
    
    // Actualizar el estado premium del usuario
    await User.update(
      {
        premium: true,
        premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
      },
      { where: { id: userId } }
    );
    
    console.log(`Pago de prueba creado con ID ${payment.id}`);
    
    return res.status(201).json({
      success: true,
      message: 'Pago de prueba creado con éxito',
      payment: {
        id: payment.id,
        template: payment.template,
        status: payment.status,
        downloadsRemaining: payment.downloadsRemaining
      }
    });
  } catch (error) {
    console.error('Error al crear pago de prueba:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear pago de prueba'
    });
  }
};