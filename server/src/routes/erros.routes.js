const express = require('express');
const router = express.Router();
const db = require('../database/db');

/**
 * GET /api/estudo/hoje
 * Retorna o estudo do dia baseado no plano
 */
router.get('/hoje', (req, res) => {
  const userId = 1; // JWT desligado

  // 1️⃣ Buscar plano do dia
  const sqlPlano = `
    SELECT 
      c.id AS conteudo_id,
      d.nome AS disciplina,
      c.titulo AS conteudo
    FROM planos p
    JOIN disciplinas d ON d.id = p.disciplina_id
    JOIN conteudos c ON c.disciplina_id = d.id
    WHERE p.user_id = ?
    ORDER BY p.ordem, c.ordem
    LIMIT 1
  `;

  db.get(sqlPlano, [userId], (err, plano) => {
    if (!plano) {
      return res.status(404).json({
        error: 'Conteúdo não identificado'
      });
    }

    const { conteudo_id, disciplina, conteudo } = plano;

    // 2️⃣ Buscar material
    db.get(
      `SELECT texto FROM materiais WHERE conteudo_id = ?`,
      [conteudo_id],
      (err, materialRow) => {

        const material =
          materialRow?.texto || 'Material não cadastrado.';

        // 3️⃣ Buscar questões
        db.all(
          `SELECT id, enunciado, alternativa_a, alternativa_b,
                  alternativa_c, alternativa_d, correta
           FROM questoes
           WHERE conteudo_id = ?`,
          [conteudo_id],
          (err, questoes) => {

            return res.json({
              disciplina,
              conteudo,
              conteudo_id,
              subtopicos: [], // opcional por agora
              material,
              questoes: questoes || []
            });
          }
        );
      }
    );
  });
});

module.exports = router;
