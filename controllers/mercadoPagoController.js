// Importación correcta al inicio
const mercadopago = require('mercadopago');
const logger = require('../utils/logger');
const Payment = require('../models/Payment');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize'); // Cambia esto

// Configuración de MercadoPago
mercadopago.configure({
  access_token: config.mercadoPago.accessToken
});

// Crear preferencia de pago
exports.createPreference = async (req, res) => {
  try {
    const { title, price, quantity, template, isSubscription, productType } = req.body;
    
    logger.info('Creando preferencia de pago', { 
      title, price, quantity, template, isSubscription, productType 
    });
    
    // Validar datos
    if (!title || !price) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    
    // Obtener ID de sesión
    const sessionId = req.cookies.sessionId || uuidv4();
    
    // Si no hay cookie de sesión, establecerla
    if (!req.cookies.sessionId) {
      res.cookie('sessionId', sessionId, { 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        sameSite: config.nodeEnv === 'production' ? 'none' : 'lax'
      });
    }
    
    // Preparar datos base para la preferencia
    const priceInteger = parseInt(price);
    const quantityInteger = parseInt(quantity || 1);
    const preferenceItems = [{
      title: title,
      unit_price: priceInteger,
      quantity: quantityInteger,
      currency_id: 'COP'
    }];
    
    // Referencia externa para suscripción o compra única
    const externalReference = isSubscription 
      ? `${sessionId}-subscription-${productType || 'interview-pack'}`
      : `${sessionId}-${template}`;
    
    // URLs de retorno
    const backUrls = {
      success: `${config.frontendUrl}/payment/mercadopago/success`,
      failure: `${config.frontendUrl}/payment/mercadopago/failure`,
      pending: `${config.frontendUrl}/payment/mercadopago/pending`
    };
    
    // Crear preferencia base
    const preference = {
      items: preferenceItems,
      external_reference: externalReference,
      back_urls: backUrls,
      auto_return: 'approved',
      notification_url: `${config.backendUrl}/api/mercadopago/webhook`,
      metadata: {
        product_type: productType || template || 'interview-pack',
        is_subscription: !!isSubscription,
        sessionId: sessionId
      }
    };
    
    // Crear preferencia en MercadoPago
    const response = await mercadopago.preferences.create(preference);
    
    // Guardar registro en la base de datos
    await Payment.create({
      sessionId: sessionId,
      mercadoPagoId: response.body.id,
      amount: priceInteger,
      status: 'pending',
      template: productType || template || 'interview-pack',
      productType: productType || template || 'interview-pack',
      isSubscription: !!isSubscription,
      downloadsRemaining: isSubscription ? 999 : 5
    });
    
    return res.status(201).json({
      id: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point
    });
  } catch (error) {
    logger.error('Error al crear preferencia', error);
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
    const { id, topic } = req.query;
    
    logger.info('Webhook recibido', { id, topic });
    
    if (topic === 'payment') {
      const paymentInfo = await mercadopago.payment.findById(id);
      
      if (!paymentInfo || !paymentInfo.body) {
        return res.status(404).send('Payment not found');
      }
      
      const payment = paymentInfo.body;
      const externalReference = payment.external_reference;
      const metadata = payment.metadata || {};
      
      if (externalReference) {
        let sessionId, template, isSubscription = false;
        
        // Verificar si es una suscripción por el formato de referencia
        if (externalReference.includes('interview-pack') || 
            externalReference.includes('cover-letter') || 
            metadata.is_subscription) {
          
          [sessionId, template] = externalReference.split('-');
          isSubscription = true;
        } else {
          [sessionId, template] = externalReference.split('-');
        }
        
        // Actualizar o crear registro de pago
        const [paymentRecord, created] = await Payment.findOrCreate({
          where: { 
            mercadoPagoId: payment.id.toString()
          },
          defaults: {
            sessionId: sessionId,
            mercadoPagoId: payment.id.toString(),
            amount: payment.transaction_amount,
            status: payment.status,
            template: template,
            productType: metadata.product_type || template,
            isSubscription: isSubscription,
            downloadsRemaining: isSubscription ? 999 : 5
          }
        });
        
        if (!created) {
          // Actualizar el registro existente
          paymentRecord.status = payment.status;
          await paymentRecord.save();
        }
        
        // Si el pago es aprobado y es para una suscripción, actualizar usuario
        if (payment.status === 'approved' && isSubscription) {
          // Encontrar al usuario por sessionId y actualizar su status
          // (esto requiere implementación adicional)
        }
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    logger.error('Error en webhook', error);
    res.status(500).send('Internal Server Error');
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