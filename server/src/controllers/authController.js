const db = require('../database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'alego-secret'; // depois vai para .env

const register = (req, res) => {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({
      error: 'Nome, email e senha são obrigatórios'
    });
  }

  const senhaHash = bcrypt.hashSync(senha, 10);

  const sql = `
    INSERT INTO users (nome, email, senha_hash)
    VALUES (?, ?, ?)
  `;

  db.run(sql, [nome, email, senhaHash], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({
          error: 'Email já cadastrado'
        });
      }

      return res.status(500).json({
        error: 'Erro ao criar usuário'
      });
    }

    return res.status(201).json({
      message: 'Usuário criado com sucesso',
      userId: this.lastID
    });
  });
};

const login = (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      error: 'Email e senha são obrigatórios'
    });
  }

  const sql = `SELECT * FROM users WHERE email = ?`;

  db.get(sql, [email], (err, user) => {
    if (err) {
      return res.status(500).json({
        error: 'Erro no servidor'
      });
    }

    if (!user) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }

    const senhaValida = bcrypt.compareSync(senha, user.senha_hash);

    if (!senhaValida) {
      return res.status(401).json({
        error: 'Credenciais inválidas'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      message: 'Login realizado com sucesso',
      token
    });
  });
};

module.exports = {
  register,
  login
};
