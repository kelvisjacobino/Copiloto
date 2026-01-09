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
   POST /api/estudo/resultado (VERSÃO DEFINITIVA)
===================================================== */
router.post('/resultado', (req, res) => {
  const { conteudo_id, acertos, total } = req.body;
  const userId = 1;

  const desempenho = total > 0 ? acertos / total : 0;
  const status = desempenho < 0.7 ? 'reforco' : 'estudado';
  const notaPercentual = Math.round(desempenho * 100);
// Dentro do router.post('/resultado') no estudo.routes.js
const { detalhes } = req.body; // Recebe a lista de acertos/erros do front

if (detalhes && detalhes.length > 0) {
  detalhes.forEach(det => {
    db.run(
      `INSERT INTO historico_questoes (user_id, questao_id, conteudo_id, resposta_usuario, acertou, data_resumo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, det.questao_id, conteudo_id, det.resposta_usuario, det.acertou, hojeISO()]
    );
  });
}
  // Usamos db.serialize para garantir que as operações rodem na ordem
  db.serialize(() => {
    
    // 1. Salva o progresso
    db.run(
      `INSERT INTO progresso (user_id, conteudo_id, status, ultima_data, nota_acerto, qtd_acertos, qtd_total)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, conteudo_id)
       DO UPDATE SET 
         status = excluded.status, 
         ultima_data = excluded.ultima_data,
         nota_acerto = excluded.nota_acerto,
         qtd_acertos = excluded.qtd_acertos,
         qtd_total = excluded.qtd_total`,
      [userId, conteudo_id, status, hojeISO(), notaPercentual, acertos, total],
      (err) => {
        if (err) {
            console.error(err.message);
            // Se houver erro aqui, enviamos a resposta e usamos RETURN para parar o código
            return res.status(500).json({ error: "Erro ao salvar no banco" });
        }
      }
    );

    // 2. Envia a resposta APENAS UMA VEZ ao final de tudo
    // Nota: O res.json deve estar fora dos callbacks individuais se não houver erro,
    // ou você deve garantir que ele não seja chamado múltiplas vezes.
    
    // A melhor forma é enviar a resposta após a última operação de banco.
    db.run("SELECT 1", [], () => {
       if (!res.headersSent) { // Proteção extra: só envia se ainda não enviou
          res.json({ 
            message: 'Estudo finalizado!', 
            status, 
            acertos, 
            total, 
            desempenho: notaPercentual + '%' 
          });
       }
    });
  });
});

module.exports = router;
