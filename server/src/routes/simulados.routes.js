const express = require('express');
const router = express.Router();
const db = require('../database/db');
const aiService = require('../services/aiService');


/**
 * POST /api/simulados/diario
 * Cria simulado diário da disciplina do dia
 */
router.post('/diario', (req, res) => {
  const userId = 1; // JWT desligado por enquanto
  const { disciplina_id } = req.body;

  if (!disciplina_id) {
    return res.status(400).json({
      error: 'disciplina_id é obrigatório'
    });
  }

  db.run(
    `INSERT INTO simulados (user_id, tipo, disciplina_id)
     VALUES (?, 'diario', ?)`,
    [userId, disciplina_id],
    function () {
      const simuladoId = this.lastID;

      const sqlQuestoes = `
        SELECT q.*
        FROM questoes q
        JOIN conteudos c ON c.id = q.conteudo_id
        WHERE c.disciplina_id = ?
        ORDER BY RANDOM()
        LIMIT 5
      `;

      db.all(sqlQuestoes, [disciplina_id], (err, questoes) => {
        if (err) {
          return res.status(500).json({
            error: 'Erro ao buscar questões'
          });
        }

        return res.json({
          simulado_id: simuladoId,
          questoes
        });
      });
    }
  );
});

/**
 * POST /api/simulados/finalizar
 * Finaliza simulado e gera reforço
 */
router.post('/finalizar', async (req, res) => {
  const userId = 1;
  const { simulado_id, respostas } = req.body;

  let acertos = 0;
  let erros = 0;
  const conteudosComErro = new Set();

  for (const r of respostas) {
    const q = await new Promise(resolve => {
      db.get(
        `SELECT correta, conteudo_id FROM questoes WHERE id = ?`,
        [r.questao_id],
        (_, row) => resolve(row)
      );
    });

    if (!q) continue;

    const correta = r.resposta === q.correta;

    db.run(`
      INSERT INTO simulado_questoes
      (simulado_id, questao_id, resposta_usuario, correta)
      VALUES (?, ?, ?, ?)
    `, [simulado_id, r.questao_id, r.resposta, correta ? 1 : 0]);

    if (correta) {
      acertos++;
    } else {
      erros++;
      conteudosComErro.add(q.conteudo_id);

      db.run(`
        INSERT INTO erros (user_id, conteudo_id, questao_id)
        VALUES (?, ?, ?)
      `, [userId, q.conteudo_id, r.questao_id]);

      db.run(`
        UPDATE progresso
        SET status = 'reforco'
        WHERE user_id = ? AND conteudo_id = ?
      `, [userId, q.conteudo_id]);
    }
  }

  // 🔥 IA: gerar novas questões para conteúdos errados
 const ia = await aiService.gerarMaterial({
  disciplina: nomeDisciplina,
  conteudo: nomeConteudo
});

const questoes = ia.questoes || [];


  res.json({
    total: respostas.length,
    acertos,
    erros,
    percentual: Math.round((acertos / respostas.length) * 100),
    novas_questoes_geradas: novasQuestoes
  });
});


/**
 * POST /api/simulados/geral
 * Cria simulado geral baseado em erros e reforços
 */
router.post('/geral', (req, res) => {
  const userId = 1;
  const LIMITE = 10;

  db.run(
    `INSERT INTO simulados (user_id, tipo)
     VALUES (?, 'geral')`,
    [userId],
    function () {
      const simuladoId = this.lastID;

      const sqlConteudos = `
        SELECT DISTINCT conteudo_id
        FROM (
          SELECT conteudo_id FROM erros WHERE user_id = ?
          UNION
          SELECT conteudo_id FROM progresso
          WHERE user_id = ? AND status = 'reforco'
        )
      `;

      db.all(sqlConteudos, [userId, userId], (err, rows) => {
        const ids = rows.map(r => r.conteudo_id);

        let sqlQuestoes = `
          SELECT q.*
          FROM questoes q
        `;

        if (ids.length > 0) {
          sqlQuestoes += `
            WHERE q.conteudo_id IN (${ids.map(() => '?').join(',')})
          `;
        }

        sqlQuestoes += `
          ORDER BY RANDOM()
          LIMIT ?
        `;

        db.all(sqlQuestoes, [...ids, LIMITE], (err, questoes) => {
          return res.json({
            simulado_id: simuladoId,
            tipo: 'geral',
            questoes
          });
        });
      });
    }
  );
});

module.exports = router;
