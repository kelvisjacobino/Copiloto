const express = require('express');
const router = express.Router();
const db = require('../database/db');
const aiService = require('../services/aiService');

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}
function normalizarAlternativas(alternativas) {
  const padrao = 'Alternativa não informada';

  // Se vier como ARRAY
  if (Array.isArray(alternativas)) {
    return {
      A: alternativas[0] || padrao,
      B: alternativas[1] || padrao,
      C: alternativas[2] || padrao,
      D: alternativas[3] || padrao,
      E: alternativas[4] || null
    };
  }

  // Se vier como OBJETO
  if (alternativas && typeof alternativas === 'object') {
    return {
      A: alternativas.A || padrao,
      B: alternativas.B || padrao,
      C: alternativas.C || padrao,
      D: alternativas.D || padrao,
      E: alternativas.E || null
    };
  }

  // Fallback absoluto
  return {
    A: padrao,
    B: padrao,
    C: padrao,
    D: padrao,
    E: null
  };
}

function carregarConteudoPorId(req, res, conteudoId) {

  if (!conteudoId) {
    return res.status(400).json({ error: 'conteudo_id inválido' });
  }

  const sqlConteudo = `
    SELECT 
      c.id,
      c.titulo AS conteudo,
      d.nome AS disciplina
    FROM conteudos c
    JOIN disciplinas d ON d.id = c.disciplina_id
    WHERE c.id = ?
  `;

  db.get(sqlConteudo, [conteudoId], async (err, conteudo) => {
    if (!conteudo) {
      return res.status(404).json({ error: 'Conteúdo não encontrado' });
    }

    const sqlMaterial = `
      SELECT texto, subtopicos
      FROM materiais
      WHERE conteudo_id = ?
    `;

    db.get(sqlMaterial, [conteudoId], async (err, materialSalvo) => {

      if (materialSalvo) {
        db.all(
          `SELECT * FROM questoes WHERE conteudo_id = ?`,
          [conteudoId],
          (err, questoes) => {
            return res.json({
              disciplina: conteudo.disciplina,
              conteudo: conteudo.conteudo,
              conteudo_id: conteudoId,
              subtopicos: JSON.parse(materialSalvo.subtopicos || '[]'),
              material: materialSalvo.texto,
              questoes
            });
          }
        );
        return;
      }

      try {
        const ia = await aiService.gerarMaterial({
          disciplina: conteudo.disciplina,
          conteudo: conteudo.conteudo
        });

        db.run(
          `INSERT INTO materiais (conteudo_id, texto, subtopicos)
           VALUES (?, ?, ?)`,
          [
            conteudoId,
            ia.material,
            JSON.stringify(ia.subtopicos || [])
          ]
        );

        ia.questoes.forEach(q => {
  const alt = normalizarAlternativas(q.alternativas);

db.run(`
  INSERT INTO questoes (
    conteudo_id,
    enunciado,
    alternativa_a,
    alternativa_b,
    alternativa_c,
    alternativa_d,
    alternativa_e,
    correta,
    comentario
  ) VALUES (
    ?,
    ?,
    COALESCE(NULLIF(?, ''), 'Alternativa não informada'),
    COALESCE(NULLIF(?, ''), 'Alternativa não informada'),
    COALESCE(NULLIF(?, ''), 'Alternativa não informada'),
    COALESCE(NULLIF(?, ''), 'Alternativa não informada'),
    NULLIF(?, ''),
    COALESCE(NULLIF(?, ''), 'A'),
    ?
  )
`, [
  conteudoId,
  q.enunciado,
  alt.A,
  alt.B,
  alt.C,
  alt.D,
  alt.E,
  q.correta || q.resposta_correta,
  q.comentario || null
]);


        });

        return res.json({
          disciplina: conteudo.disciplina,
          conteudo: conteudo.conteudo,
          conteudo_id: conteudoId,
          subtopicos: ia.subtopicos || [],
          material: ia.material,
          questoes: ia.questoes
        });

      } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Erro ao gerar material' });
      }
    });
  });
}


/* =====================================================
   GET /api/estudo/hoje
===================================================== */
router.get('/hoje', (req, res) => {
  const userId = 1;

  const sql = `
    SELECT c.id
    FROM conteudos c
    LEFT JOIN progresso p
      ON p.conteudo_id = c.id
      AND p.user_id = ?
    WHERE p.status IS NULL
       OR p.status != 'estudado'
    ORDER BY c.id
    LIMIT 1
  `;

  db.get(sql, [userId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao buscar estudo do dia' });
    }

    if (!row) {
      return res.json({ message: 'Nenhum estudo pendente para hoje 🎉' });
    }

    carregarConteudoPorId(req, res, row.id);

  });
});

/* =====================================================
   GET /api/estudo/:conteudoId
===================================================== */
router.get('/:conteudoId', (req, res) => {
  const conteudoId = Number(req.params.conteudoId);

  // ✅ validação primeiro
  if (!conteudoId) {
    return res.status(400).json({ error: 'conteudo_id inválido' });
  }

  // ✅ delega e ENCERRA a requisição
  return carregarConteudoPorId(req, res, conteudoId);
});

/* =====================================================
   POST /api/estudo/leitura
===================================================== */
router.post('/leitura', (req, res) => {
  const { conteudo_id } = req.body;
  const userId = 1;

  if (!conteudo_id) {
    return res.status(400).json({ error: 'conteudo_id é obrigatório' });
  }

  db.run(
    `
    INSERT INTO progresso (user_id, conteudo_id, status, ultima_data)
    VALUES (?, ?, 'leitura', ?)
    ON CONFLICT(user_id, conteudo_id)
    DO UPDATE SET status = 'leitura', ultima_data = ?
    `,
    [userId, conteudo_id, hojeISO(), hojeISO()],
    () => res.json({ message: 'Leitura registrada' })
  );
});

/* =====================================================
   POST /api/estudo/resultado
===================================================== */
router.post('/resultado', (req, res) => {
  const { conteudo_id, acertos, total } = req.body;
  const userId = 1;

  if (!conteudo_id) {
    return res.status(400).json({ error: 'conteudo_id é obrigatório' });
  }

  const desempenho = total > 0 ? acertos / total : 0;
  const status = desempenho < 0.6 ? 'reforco' : 'estudado';

  db.serialize(() => {
    db.run(
      `
      INSERT INTO progresso (user_id, conteudo_id, status, ultima_data)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, conteudo_id)
      DO UPDATE SET status = ?, ultima_data = ?
      `,
      [userId, conteudo_id, status, hojeISO(), status, hojeISO()]
    );

    db.run(
      `DELETE FROM revisoes WHERE user_id = ? AND conteudo_id = ?`,
      [userId, conteudo_id]
    );

    [
      { tipo: 'D1', dias: 1 },
      { tipo: 'D7', dias: 7 },
      { tipo: 'D30', dias: 30 }
    ].forEach(r => {
      db.run(
        `INSERT INTO revisoes (user_id, conteudo_id, tipo, data_prevista, status)
         VALUES (?, ?, ?, ?, 'pendente')`,
        [userId, conteudo_id, r.tipo, addDias(r.dias)]
      );
    });
  });

  res.json({ message: 'Estudo finalizado', status });
});

module.exports = router;
