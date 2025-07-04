const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const { addDays } = require('date-fns');

exports.createSubscription = async (req, res) => {
  try {
    const { userId } = req.user;
    const { paymentMethod, plan, amount } = req.body;
    
    // Procesar pago con MercadoPago (similar a la lógica actual de pagos)
    // ...código para crear pago...
    
    // Crear la suscripción
    const endDate = addDays(new Date(), 30); // 30 días desde hoy
    
    const subscription = await Subscription.create({
      userId,
      status: 'active',
      startDate: new Date(),
      endDate,
      subscriptionId: 'mp_' + Date.now() // ID simulado
    });
    
    // Actualizar usuario
    await User.update({ 
      subscription_active: true,
      subscription_end_date: endDate 
    }, { 
      where: { id: userId } 
    });
    
    res.status(201).json({
      success: true,
      subscription
    });
    
  } catch (error) {
    console.error('Error al crear suscripción:', error);
    res.status(500).json({ error: 'Error al procesar la suscripción' });
  }
};

exports.checkSubscription = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const subscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active',
        endDate: {
          [Op.gt]: new Date() // Fecha de fin mayor que hoy
        }
      },
      order: [['endDate', 'DESC']]
    });
    
    res.json({
      active: !!subscription,
      subscription: subscription || null
    });
    
  } catch (error) {
    console.error('Error al verificar suscripción:', error);
    res.status(500).json({ error: 'Error al verificar suscripción' });
  }
};