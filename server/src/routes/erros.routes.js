const express = require('express');
const router = express.Router();
const db = require('../database/db');

/**
 * GET /api/erros/lista
 * Retorna apenas os conteúdos marcados como 'reforco' para o aluno
 */
// No seu arquivo src/routes/erros.routes.js
router.get('/lista', (req, res) => {
  const userId = 1;

  const sql = `
    SELECT 
      c.id AS conteudo_id, 
      d.nome AS disciplina, 
      c.titulo AS conteudo, 
      p.ultima_data,
      p.nota_acerto,
      p.qtd_acertos,
      p.qtd_total
    FROM progresso p
    JOIN conteudos c ON c.id = p.conteudo_id
    JOIN disciplinas d ON d.id = c.disciplina_id
    WHERE p.user_id = ? AND p.status = 'reforco'
    ORDER BY p.ultima_data DESC
  `;

  db.all(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ erros: rows || [] });
  });
});
module.exports = router;