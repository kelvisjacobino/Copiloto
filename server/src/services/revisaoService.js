const db = require('../database/db');

exports.agendarRevisao = (userId, disciplinaNome, tipoRevisao) => {
  let dias = 0;

  if (tipoRevisao === 'D+1') dias = 1;
  if (tipoRevisao === 'D+7') dias = 7;
  if (tipoRevisao === 'D+30') dias = 30;

  const data = new Date();
  data.setDate(data.getDate() + dias);
  const dataFormatada = data.toISOString().split('T')[0];

  // 1️⃣ Buscar o ID da disciplina
  db.get(
    `SELECT id FROM disciplinas WHERE nome = ?`,
    [disciplinaNome],
    (err, disciplina) => {
      if (err || !disciplina) {
        console.error('Disciplina não encontrada:', disciplinaNome);
        return;
      }

      // 2️⃣ Inserir revisão com disciplina_id
      db.run(
        `
        INSERT INTO revisoes (user_id, disciplina_id, data_prevista, status)
        VALUES (?, ?, ?, 'pendente')
      `,
        [userId, disciplina.id, dataFormatada],
        (err) => {
          if (err) {
            console.error('Erro ao agendar revisão:', err.message);
          }
        }
      );
    }
  );
};
