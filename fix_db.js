const path = require('path');
// Ajustando o caminho para apontar para dentro de 'server/src/database/db'
const dbPath = path.join(__dirname, 'server', 'src', 'database', 'db');
const db = require(dbPath); 

db.serialize(() => {
    console.log("🛠️ Iniciando reconstrução da tabela...");

    // Cria a tabela de histórico que o erros.js precisa
    db.run(`
        CREATE TABLE IF NOT EXISTS historico_estudos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conteudo_id INTEGER NOT NULL,
            status TEXT DEFAULT 'reforco',
            data_estudo DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conteudo_id) REFERENCES conteudos(id)
        )
    `, (err) => {
        if (err) {
            console.error("❌ Erro ao criar tabela:", err.message);
        } else {
            console.log("✅ Tabela 'historico_estudos' criada com sucesso!");
        }
    });
});