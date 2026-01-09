const path = require('path');
// Ajustando o caminho para apontar para dentro de 'server/src/database/db'
const dbPath = path.join(__dirname, 'server', 'src', 'database', 'db');
const db = require(dbPath); 


db.serialize(() => {
    console.log("🛠️ Corrigindo tabela historico_estudos...");
    
    // Deleta a tabela antiga
    db.run("DROP TABLE IF EXISTS historico_questoes");
    
    // Cria a tabela nova com a coluna questao_id
    db.run(`
        CREATE TABLE historico_questoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTE
            questao_id INTEGER,
            conteudo_id INTEGER,
            resposta_usuario TEXT,
            acertou INTEGER,
            data_resumo TEXT
        )
    `, (err) => {
        if (err) console.error("❌ Erro ao criar tabela:", err.message);
        else console.log("✅ Tabela historico_questoes criada com sucesso!");
    });
});