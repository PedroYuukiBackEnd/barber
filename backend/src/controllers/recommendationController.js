const { createRecommendation } = require('../models/recommendationModel');
const { normalizeAttachment } = require('../utils/attachment');

async function createRecommendationHandler(req, res, next) {
  try {
    const { client_name, barbershop_name, recommendation, attachment_name, attachment_data } = req.body;
    if (!client_name || !barbershop_name || !recommendation) {
      return res.status(400).json({ message: 'Preencha nome do cliente, barbearia e recomendacao.' });
    }

    const { attachmentName, attachmentData } = normalizeAttachment(attachment_name, attachment_data, {
      fallbackName: 'anexo-recomendacao',
    });

    const saved = await createRecommendation(
      req.user.tenant_id,
      req.user.id,
      client_name.trim(),
      barbershop_name.trim(),
      recommendation.trim(),
      attachmentName,
      attachmentData
    );

    res.status(201).json({ recommendation: saved });
  } catch (error) {
    next(error);
  }
}

module.exports = { createRecommendation: createRecommendationHandler };
