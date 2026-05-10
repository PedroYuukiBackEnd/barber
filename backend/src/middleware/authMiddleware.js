const jwt = require('jsonwebtoken');
const db = require('../config/db');

async function authMiddleware(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Não autorizado. Faça login.' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'uma_chave_super_segura';
    const payload = jwt.verify(token, secret);
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT id, email, name, tenant_id, role FROM users WHERE id = ?', [payload.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    if (!user) {
      return res.status(401).json({ message: 'Token inválido.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Sessão expirada ou inválida.' });
  }
}

module.exports = { authMiddleware };
