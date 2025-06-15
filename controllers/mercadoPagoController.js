const mercadopago = require('../config/mercadopago');
const logger = require('../utils/logger');

/**
 * Crea una preferencia de pago en MercadoPago
 */
exports.createPreference = async (req, res) => {
    try {
        const { title, price, quantity, template } = req.body;
        
        logger.info('Creando preferencia de pago', { title, price, quantity, template });
        
        // Validar datos
        if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            return res.status(400).json({ error: 'Precio inválido' });
        }
        
        // En Colombia, MercadoPago espera el precio en enteros (sin centavos)
        // Los precios ya vienen como enteros (3000 o 5000)
        let priceInteger = parseInt(price);
        
        // Comprobar que el precio sea correcto según la plantilla
        const expectedPrice = template === 'professional' ? 3000 : 5000;
        if (priceInteger !== expectedPrice) {
            logger.warn('Precio incorrecto para la plantilla', { 
                template, 
                receivedPrice: priceInteger, 
                expectedPrice 
            });
            // Usar el precio esperado para evitar manipulaciones
            priceInteger = expectedPrice;
        }
        
        const preference = {
            items: [
                {
                    id: "cv-premium-" + Date.now(),
                    title: title || 'CV Premium sin marca de agua',
                    description: template === 'professional' 
                        ? 'CV Premium Profesional ATS' 
                        : 'CV Premium con diseño personalizado',
                    picture_url: "https://www.minicv.com/assets/cv-preview.png",
                    category_id: "digital_goods",
                    unit_price: priceInteger,
                    quantity: parseInt(quantity) || 1,
                    currency_id: "COP" // Moneda de Colombia
                }
            ],
            back_urls: {
                success: `${process.env.FRONTEND_URL}/payment/mercadopago/success`,
                failure: `${process.env.FRONTEND_URL}/payment/mercadopago/failure`,
                pending: `${process.env.FRONTEND_URL}/payment/mercadopago/pending`
            },
            external_reference: template || 'professional'
        };
        
        logger.info('Enviando preferencia a MercadoPago', preference);
        
        const response = await mercadopago.preferences.create(preference);
        
        logger.info('Respuesta de MercadoPago', { 
            id: response.body.id,
            init_point: response.body.init_point
        });
        
        return res.status(200).json({
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

/**
 * Verifica el estado de un pago
 */
exports.checkPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        if (!paymentId) {
            return res.status(400).json({ error: 'ID de pago requerido' });
        }
        
        logger.info(`Verificando estado del pago: ${paymentId}`);
        
        const response = await mercadopago.payment.get(paymentId);
        
        logger.info(`Estado del pago: ${response.body.status}`, {
            payment_id: paymentId,
            status: response.body.status
        });
        
        res.status(200).json({
            status: response.body.status,
            status_detail: response.body.status_detail,
            external_reference: response.body.external_reference
        });
    } catch (error) {
        logger.error(`Error al verificar pago: ${req.params.paymentId}`, error);
        res.status(500).json({ 
            error: 'Error al verificar el estado del pago',
            details: error.message
        });
    }
};

/**
 * Maneja las notificaciones (webhooks) de MercadoPago
 */
exports.handleWebhook = async (req, res) => {
    try {
        const { type, data } = req.body;
        
        logger.info('Webhook recibido', { type, data });
        
        // Si es una notificación de pago
        if (type === 'payment') {
            const paymentId = data.id;
            
            // Obtener detalles del pago
            const paymentInfo = await mercadopago.payment.get(paymentId);
            const status = paymentInfo.body.status;
            
            logger.info(`Pago ${paymentId} con estado: ${status}`);
            
            // Aquí puedes implementar lógica adicional según el estado del pago
            // Por ejemplo, actualizar una base de datos, enviar emails, etc.
        }
        
        // Siempre responder con 200 OK para que MercadoPago no reintente
        res.status(200).send('OK');
    } catch (error) {
        logger.error('Error al procesar webhook', error);
        // Aún con error, responder 200 para evitar reintentos
        res.status(200).send('Error processed');
    }
};

// Añade esta función al controlador
exports.getPublicKey = (req, res) => {
    res.json({ publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY });
};