const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const db = require('../database/db');

// Lista revisões do usuário logado
router.get('/revisoes', authMiddleware, (req, res) => {
  const userId = req.userId;

  const sql = `
    SELECT 
      r.id,
      d.nome AS disciplina,
      r.data_prevista,
      r.status
    FROM revisoes r
    JOIN disciplinas d ON d.id = r.disciplina_id
    WHERE r.user_id = ?
    ORDER BY r.data_prevista ASC
  `;

  db.all(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        error: 'Erro ao buscar revisões'
      });
    }

    return res.json(rows);
  });
});

module.exports = router;
