const db = require('./db');

const userId = 2; // ajuste se necessário

const planos = [
  { dia: 'Segunda', disciplina: 'TI - Redes', ordem: 1 },
  { dia: 'Segunda', disciplina: 'Português', ordem: 2 },
  { dia: 'Terça', disciplina: 'TI - Hardware', ordem: 1 },
  { dia: 'Quarta', disciplina: 'Raciocínio Lógico', ordem: 1 }
];

planos.forEach((plano) => {
  db.run(
    `
    INSERT INTO planos (user_id, dia_semana, disciplina, ordem)
    VALUES (?, ?, ?, ?)
  `,
    [userId, plano.dia, plano.disciplina, plano.ordem],
    (err) => {
      if (err) {
        console.error('Erro ao inserir plano:', err.message);
      }
    }
  );
});

console.log('✅ Planos inseridos com sucesso');
