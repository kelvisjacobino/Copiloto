const fs = require('fs');
const path = require('path');
const db = require('./db');

const sql = fs.readFileSync(
  path.resolve(__dirname, 'migrations.sql'),
  'utf8'
);

db.exec(sql, (err) => {
  if (err) {
    console.error('❌ Erro ao criar tabelas:', err.message);
  } else {
    console.log('✅ Tabelas criadas com sucesso');
  }
});
