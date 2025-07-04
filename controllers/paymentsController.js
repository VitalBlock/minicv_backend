// Añadir esta función para manejar la creación de suscripciones
exports.createSubscription = async (req, res) => {
  try {
    const { userId } = req.user;
    const { paymentMethod, plan, amount } = req.body;
    
    // Verificar si ya tiene una suscripción activa
    const existingSubscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active',
        endDate: {
          [Op.gt]: new Date()
        }
      }
    });
    
    if (existingSubscription) {
      return res.status(400).json({
        error: 'Ya tienes una suscripción activa'
      });
    }
    
    // Crear registro de pago
    const payment = await Payment.create({
      userId,
      sessionId: req.sessionId || 'session_' + Date.now(),
      mercadoPagoId: 'mp_' + Date.now(),
      amount: amount || 15000,
      status: 'approved',
      template: plan || 'interview-pack'
    });
    
    // Calcular fecha de fin (30 días desde hoy)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    // Crear la suscripción
    const subscription = await Subscription.create({
      userId,
      planType: plan || 'interview-pack',
      status: 'active',
      startDate: new Date(),
      endDate,
      paymentId: payment.id,
      price: amount || 15000
    });
    
    // Actualizar usuario
    await User.update({
      premium: true,
      subscription_active: true,
      subscription_end_date: endDate
    }, {
      where: { id: userId }
    });
    
    return res.status(201).json({
      success: true,
      subscription,
      payment
    });
  } catch (error) {
    console.error('Error al crear suscripción:', error);
    return res.status(500).json({
      error: 'Error al procesar la suscripción'
    });
  }
};

// Añadir esta función para verificar estado de suscripción
exports.checkSubscription = async (req, res) => {
  try {
    const { userId } = req.user;
    
    const subscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active',
        endDate: {
          [Op.gt]: new Date()
        }
      },
      order: [['endDate', 'DESC']]
    });
    
    return res.json({
      active: !!subscription,
      subscription: subscription || null,
      expiresAt: subscription ? subscription.endDate : null
    });
  } catch (error) {
    console.error('Error al verificar suscripción:', error);
    return res.status(500).json({
      error: 'Error al verificar suscripción'
    });
  }
};