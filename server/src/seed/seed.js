const db = require('../database/db');

console.log('🔥 SEED CORRETO SENDO EXECUTADO 🔥');


const DISCIPLINAS = [
  {
    id: 1,
    nome: 'TI - Redes',
    peso: 3,
    conteudos: [
      'Conceitos básicos de redes',
      'Tipos de redes',
      'Topologias de rede',
      'Modelo OSI',
      'Modelo TCP/IP'
    ]
  },
  {
    id: 2,
    nome: 'TI - Hardware',
    peso: 2,
    conteudos: [
      'Arquitetura de computadores',
      'Processadores',
      'Memórias',
      'Dispositivos de entrada e saída',
      'Armazenamento'
    ]
  },
  {
    id: 3,
    nome: 'TI - Sistemas Operacionais',
    peso: 3,
    conteudos: [
      'Conceitos básicos de SO',
      'Processos e threads',
      'Gerenciamento de memória',
      'Sistemas de arquivos',
      'Escalonamento'
    ]
  },
  {
    id: 4,
    nome: 'TI - Banco de Dados',
    peso: 3,
    conteudos: [
      'Conceitos de banco de dados',
      'Modelo relacional',
      'SQL básico',
      'Normalização',
      'Transações'
    ]
  },
  {
    id: 5,
    nome: 'TI - Segurança da Informação',
    peso: 4,
    conteudos: [
      'Conceitos de segurança',
      'Criptografia',
      'Controle de acesso',
      'Ameaças e ataques',
      'Segurança em redes'
    ]
  }
];

async function runSeed() {
  console.log('🌱 Iniciando seed do banco...');

  await exec(`DELETE FROM revisoes`);
  await exec(`DELETE FROM progresso`);
  await exec(`DELETE FROM questoes`);
  await exec(`DELETE FROM materiais`);
  await exec(`DELETE FROM conteudos`);
  await exec(`DELETE FROM planos`);
  await exec(`DELETE FROM disciplinas`);

  // ===============================
  // DISCIPLINAS
  // ===============================
  for (const d of DISCIPLINAS) {
    await exec(
      `INSERT INTO disciplinas (id, nome, peso) VALUES (?, ?, ?)`,
      [d.id, d.nome, d.peso]
    );
  }

  // ===============================
  // CONTEÚDOS + MATERIAL BÁSICO
  // ===============================
  for (const d of DISCIPLINAS) {
    let ordem = 1;

    for (const titulo of d.conteudos) {
      const result = await execInsert(
        `INSERT INTO conteudos (disciplina_id, titulo, ordem)
         VALUES (?, ?, ?)`,
        [d.id, titulo, ordem]
      );

      const conteudoId = result.lastID;

      await exec(
        `INSERT INTO materiais (conteudo_id, texto, subtopicos)
         VALUES (?, ?, ?)`,
        [
          conteudoId,
          `${d.nome} — ${titulo}\n\nMaterial introdutório gerado pelo seed.`,
          JSON.stringify([])
        ]
      );

      ordem++;
    }
  }

  // ===============================
  // PLANO SEMANAL (user_id = 1)
  // ===============================
  const plano = [
    ['Segunda', 1],
    ['Terça', 2],
    ['Quarta', 3],
    ['Quinta', 4],
    ['Sexta', 5]
  ];

  for (let i = 0; i < plano.length; i++) {
    await exec(
      `INSERT INTO planos (user_id, disciplina_id, dia_semana, ordem)
       VALUES (1, ?, ?, ?)`,
      [plano[i][1], plano[i][0], i + 1]
    );
  }

  console.log('✅ Seed finalizado com sucesso!');
  process.exit(0);
}

// ===============================
// HELPERS
// ===============================
function exec(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function execInsert(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

runSeed();
