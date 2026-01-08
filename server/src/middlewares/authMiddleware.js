const jwt = require('jsonwebtoken');

// 🔴 CONTROLE CENTRAL
const AUTH_ENABLED = false;

module.exports = (req, res, next) => {
  // 🔓 AUTENTICAÇÃO DESATIVADA
  if (!AUTH_ENABLED) {
    req.userId = 1; // usuário fixo de desenvolvimento
    return next();
  }

  // 🔐 AUTENTICAÇÃO NORMAL (fica pronta)
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
