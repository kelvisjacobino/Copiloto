const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const db = require('../database/db');

/**
 * GET /api/plano/hoje
 * Retorna o plano do dia (com suporte a offset)
 * Ex: /api/plano/hoje?offset=1 → amanhã
 */
router.get('/hoje', authMiddleware, (req, res) => {
  const userId = req.userId;

  const dias = [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado'
  ];

  const hojeIndex = new Date().getDay();
  const hoje = dias[hojeIndex];

  // 🟡 DOMINGO → REVISÃO
  if (hoje === 'Domingo') {
    return res.json({
      dia: 'Domingo',
      tempo_total: '1h',
      disciplina: 'Revisão Geral',
      conteudo: 'Revisão semanal',
      acao: 'revisao',
      conteudo_id: 999,
      total_conteudos: 0,
      concluidos: 0
    });
  }

  // 1️⃣ Disciplina do dia
  const sqlDisciplina = `
    SELECT 
      p.disciplina_id,
      d.nome AS disciplina
    FROM planos p
    JOIN disciplinas d ON d.id = p.disciplina_id
    WHERE p.user_id = ?
      AND p.dia_semana = ?
    ORDER BY p.ordem
    LIMIT 1
  `;

  db.get(sqlDisciplina, [userId, hoje], (err, plano) => {
    if (err || !plano) {
      return res.json({ message: 'Hoje é dia de descanso 😌' });
    }

    const { disciplina_id, disciplina } = plano;

    // 2️⃣ Progresso da disciplina
    const sqlProgresso = `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN p.status = 'estudado' THEN 1 ELSE 0 END) AS concluidos
      FROM conteudos c
      LEFT JOIN progresso p
        ON p.conteudo_id = c.id
        AND p.user_id = ?
      WHERE c.disciplina_id = ?
    `;

    db.get(sqlProgresso, [userId, disciplina_id], (err, progresso) => {
      const totalConteudos = progresso?.total || 0;
      const concluidos = progresso?.concluidos || 0;

      // 3️⃣ Conteúdo em reforço
      const sqlReforco = `
        SELECT c.id, c.titulo
        FROM conteudos c
        JOIN progresso p ON p.conteudo_id = c.id
        WHERE p.user_id = ?
          AND p.status = 'reforco'
          AND c.disciplina_id = ?
        ORDER BY c.ordem
        LIMIT 1
      `;

      db.get(sqlReforco, [userId, disciplina_id], (err, conteudoReforco) => {
        if (conteudoReforco) {
          return res.json({
            dia: hoje,
            tempo_total: '2h',
            disciplina,
            disciplina_id,
            conteudo: conteudoReforco.titulo,
            conteudo_id: conteudoReforco.id,
            acao: 'reforco',
            total_conteudos: totalConteudos,
            concluidos
          });
        }

        // 4️⃣ Próximo conteúdo pendente
        const sqlPendente = `
          SELECT c.id, c.titulo
          FROM conteudos c
          LEFT JOIN progresso p
            ON p.conteudo_id = c.id
            AND p.user_id = ?
          WHERE c.disciplina_id = ?
            AND (p.status IS NULL OR p.status = 'leitura')
          ORDER BY c.ordem
          LIMIT 1
        `;

        db.get(sqlPendente, [userId, disciplina_id], (err, conteudo) => {
          if (!conteudo) {
            return res.json({
              dia: hoje,
              disciplina,
              disciplina_id,
              message: 'Disciplina concluída 🎉',
              total_conteudos: totalConteudos,
              concluidos: totalConteudos
            });
          }

          return res.json({
            dia: hoje,
            tempo_total: '2h',
            disciplina,
            disciplina_id,
            conteudo: conteudo.titulo,
            conteudo_id: conteudo.id,
            acao: 'estudar',
            total_conteudos: totalConteudos,
            concluidos
          });
        });
      });
    });
  });
});

/**
 * GET /api/plano/trilha
 * Retorna a trilha da disciplina do dia
 */
router.get('/trilha', authMiddleware, (req, res) => {
  const userId = req.userId;

  const dias = [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado'
  ];

  const hojeIndex = new Date().getDay();
  const hoje = dias[hojeIndex];

  // Domingo não tem trilha tradicional
  if (hoje === 'Domingo') {
    return res.json({
      tipo: 'revisao_semanal',
      message: 'Domingo é dia de revisão geral'
    });
  }

  const sqlDisciplina = `
    SELECT p.disciplina_id, d.nome AS disciplina
    FROM planos p
    JOIN disciplinas d ON d.id = p.disciplina_id
    WHERE p.user_id = ?
      AND p.dia_semana = ?
    ORDER BY p.ordem
    LIMIT 1
  `;

  db.get(sqlDisciplina, [userId, hoje], (err, plano) => {
    if (!plano) {
      return res.json({ message: 'Sem trilha hoje' });
    }

    const { disciplina_id, disciplina } = plano;

    const sqlTrilha = `
      SELECT
        c.id,
        c.titulo,
        COALESCE(p.status, 'pendente') AS status
      FROM conteudos c
      LEFT JOIN progresso p
        ON p.conteudo_id = c.id
        AND p.user_id = ?
      WHERE c.disciplina_id = ?
      ORDER BY c.ordem
    `;

    db.all(sqlTrilha, [userId, disciplina_id], (err, trilha) => {
      if (err) {
        return res.status(500).json({
          error: 'Erro ao buscar trilha'
        });
      }

      return res.json({
        disciplina,
        disciplina_id,
        trilha
      });
    });
  });
});

module.exports = router;
