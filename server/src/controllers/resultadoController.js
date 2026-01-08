const db = require('../database/db');
const cicloService = require('../services/cicloService');
const revisaoService = require('../services/revisaoService');

exports.registrarResultado = (req, res) => {
  const userId = req.userId;

  const { disciplina, acertos, total, tempo_medio } = req.body;

  if (!disciplina || acertos == null || total == null) {
    return res.status(400).json({
      error: 'Campos obrigatórios: disciplina, acertos, total'
    });
  }

  const percentual = (acertos / total) * 100;

  // 🔹 1. Descobrir disciplina_id
  const sqlDisciplina = `
    SELECT id FROM disciplinas WHERE nome = ?
  `;

  db.get(sqlDisciplina, [disciplina], (err, disc) => {
    if (err || !disc) {
      return res.status(400).json({ error: 'Disciplina inválida' });
    }

    const disciplinaId = disc.id;

    // 🔹 2. Descobrir conteúdo atual (reforço ou pendente)
    const sqlConteudo = `
      SELECT c.id
      FROM conteudos c
      LEFT JOIN progresso p
        ON p.conteudo_id = c.id
        AND p.user_id = ?
      WHERE c.disciplina_id = ?
        AND (p.status IS NULL OR p.status IN ('pendente', 'reforco'))
      ORDER BY 
        CASE p.status
          WHEN 'reforco' THEN 0
          ELSE 1
        END,
        c.ordem
      LIMIT 1
    `;

    db.get(sqlConteudo, [userId, disciplinaId], (err, conteudo) => {
      if (!conteudo) {
        return res.status(400).json({
          error: 'Nenhum conteúdo ativo para esta disciplina'
        });
      }

      const conteudoId = conteudo.id;
      const statusFinal = percentual >= 70 ? 'estudado' : 'reforco';

      // 🔹 3. Atualizar progresso
      const sqlUpsert = `
        INSERT INTO progresso (user_id, conteudo_id, status)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id, conteudo_id)
        DO UPDATE SET status = excluded.status
      `;

      db.run(sqlUpsert, [userId, conteudoId, statusFinal], (err) => {
        if (err) {
          return res.status(500).json({
            error: 'Erro ao atualizar progresso'
          });
        }

        // 🔹 4. Decisão adaptativa + revisão
        const decisao = cicloService.avaliarResultado(
          percentual,
          tempo_medio
        );

        revisaoService.agendarRevisao(
          userId,
          disciplina,
          decisao.revisao
        );

        return res.json({
          status: 'processado',
          desempenho: `${percentual.toFixed(1)}%`,
          conteudo_status: statusFinal,
          decisao
        });
      });
    });
  });
};
