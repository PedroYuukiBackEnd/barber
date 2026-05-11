const { createRecommendation } = require('../models/recommendationModel');

async function createRecommendationHandler(req, res, next) {
  try {
    const { client_name, barbershop_name, recommendation } = req.body;
    if (!client_name || !barbershop_name || !recommendation) {
      return res.status(400).json({ message: 'Preencha nome do cliente, barbearia e recomendacao.' });
    }

    const saved = await createRecommendation(
      req.user.tenant_id,
      req.user.id,
      client_name.trim(),
      barbershop_name.trim(),
      recommendation.trim()
    );

    res.status(201).json({ recommendation: saved });
  } catch (error) {
    next(error);
  }
}

module.exports = { createRecommendation: createRecommendationHandler };
