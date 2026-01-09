// debug_progresso.js
const path = require('path');
// Ajustando o caminho para apontar para dentro de 'server/src/database/db'
const dbPath = path.join(__dirname, 'server', 'src', 'database', 'db');
const db = require(dbPath); 

console.log('🔍 INICIANDO DIAGNÓSTICO DO BANCO DE DADOS...\n');

const queries = [
  { label: '📊 CONTEÚDOS TOTAIS', sql: 'SELECT COUNT(*) as total FROM conteudos' },
  { label: '📈 REGISTROS EM PROGRESSO', sql: 'SELECT * FROM progresso' },
  { label: '🎯 RESUMO POR STATUS', sql: 'SELECT status, COUNT(*) as qtd FROM progresso GROUP BY status' }
];

async function rodarDiagnostico() {
  for (const q of queries) {
    console.log(`--- ${q.label} ---`);
    await new Promise(resolve => {
      db.all(q.sql, [], (err, rows) => {
        if (err) {
          console.error('❌ Erro na query:', err.message);
        } else {
          if (rows.length === 0) console.log('(Tabela vazia)');
          else console.table(rows);
        }
        resolve();
      });
    });
  }
  console.log('\n✅ Diagnóstico concluído. Verifique os dados acima.');
  db.close();
}

rodarDiagnostico();