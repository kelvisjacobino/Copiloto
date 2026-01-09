const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const db = require('../database/db');

// ==========================================
// ROTA: /api/plano/hoje (CORRIGIDA)
// ==========================================
router.get('/hoje', authMiddleware, (req, res) => {
  const userId = req.userId;
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const hoje = dias[new Date().getDay()];

  if (hoje === 'Domingo') {
    return res.json({ dia: hoje, acao: 'revisao', disciplina: 'Revisão Geral', total_conteudos: 0, concluidos: 0 });
  }

  const sqlDisciplina = `
    SELECT p.disciplina_id, d.nome AS disciplina
    FROM planos p
    JOIN disciplinas d ON d.id = p.disciplina_id
    WHERE p.user_id = ? AND p.dia_semana = ? LIMIT 1
  `;

  db.get(sqlDisciplina, [userId, hoje], (err, plano) => {
    if (err || !plano) return res.json({ message: 'Hoje é dia de descanso 😌' });

    const { disciplina_id, disciplina } = plano;

    const sqlProximo = `
      SELECT c.id, c.titulo, p.status
      FROM conteudos c
      LEFT JOIN progresso p ON p.conteudo_id = c.id AND p.user_id = ?
      WHERE c.disciplina_id = ? AND (p.status IS NULL OR p.status != 'estudado')
      ORDER BY c.ordem ASC LIMIT 1
    `;

    db.get(sqlProximo, [userId, disciplina_id], (err, conteudo) => {
   // Altere a query sqlGeral no plano.routes.js para:
const sqlGeral = `
  SELECT 
    COUNT(c.id) AS total,
    SUM(CASE WHEN p.status IN ('estudado', 'reforco') THEN 1 ELSE 0 END) AS concluidos
  FROM conteudos c
  LEFT JOIN progresso p ON p.conteudo_id = c.id AND p.user_id = ?
  WHERE c.disciplina_id = ?
`;

      db.get(sqlGeral, [userId, disciplina_id], (err, resultadoProgresso) => {
        const total = resultadoProgresso?.total || 0;
        const concluidos = resultadoProgresso?.concluidos || 0;

        if (!conteudo) {
          return res.json({ dia: hoje, disciplina, message: 'Disciplina concluída 🎉', total_conteudos: total, concluidos: total });
        }

        res.json({
          dia: hoje,
          disciplina,
          disciplina_id,
          conteudo: conteudo.titulo,
          conteudo_id: conteudo.id,
          acao: conteudo.status === 'reforco' ? 'reforco' : 'estudar',
          total_conteudos: total,
          concluidos: concluidos
        });
      });
    });
  });
});

// ==========================================
// ROTA: /api/plano/trilha (CORRIGIDA)
// ==========================================
router.get('/trilha', authMiddleware, (req, res) => {
  const userId = req.userId;
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const hoje = dias[new Date().getDay()];

  // 1. Descobre qual disciplina é hoje
  const sqlDis = `SELECT disciplina_id FROM planos WHERE user_id = ? AND dia_semana = ? LIMIT 1`;

  db.get(sqlDis, [userId, hoje], (err, plano) => {
    if (err || !plano) return res.json({ trilha: [] });

    // 2. Busca todos os conteúdos daquela disciplina e o status do usuário
    const sqlT = `
      SELECT 
        c.id, 
        c.titulo, 
        COALESCE(p.status, 'pendente') AS status
      FROM conteudos c
      LEFT JOIN progresso p ON p.conteudo_id = c.id AND p.user_id = ?
      WHERE c.disciplina_id = ?
      ORDER BY c.ordem ASC
    `;

    db.all(sqlT, [userId, plano.disciplina_id], (err, rows) => {
      if (err) {
        console.error("Erro SQL Trilha:", err);
        return res.status(500).json({ error: "Erro na trilha" });
      }
      // Garante que sempre envie um objeto com a chave 'trilha'
      res.json({ trilha: rows || [] });
    });
  });
});

module.exports = router;