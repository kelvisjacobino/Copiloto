const path = require('path');
// Ajustando o caminho para apontar para dentro de 'server/src/database/db'
const dbPath = path.join(__dirname, 'server', 'src', 'database', 'db');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    console.log("Minhas tabelas são:", tables.map(t => t.name));
});



db.serialize(() => {
    console.log("🧹 Iniciando limpeza geral do banco de dados...");

    // Ordem segura para evitar erros de integridade
    const tabelasParaLimpar = [
        'historico_questoes',
        'historico_ia',
        'resultados_estudo',
        'erros',
        'simulado_questoes',
        'simulados',
        'questoes_old',
        'respostas_usuario',
        'progresso',
        'materiais',
        'planos',
        'revisoes',
        'resultados_questoes',
        'questoes',
        'conteudos',
        'disciplinas',
        'users'
    ];

    db.run("BEGIN TRANSACTION");

    tabelasParaLimpar.forEach(tabela => {
        db.run(`DELETE FROM ${tabela}`, (err) => {
            if (err) console.error(`❌ Erro ao limpar ${tabela}:`, err.message);
            else console.log(`✅ Tabela ${tabela} limpa.`);
        });
    });

    // Reseta os IDs (autoincrement) para começarem do 1 novamente
    db.run(`DELETE FROM sqlite_sequence`, (err) => {
        if (!err) console.log("🔢 Contadores de ID resetados.");
    });

    db.run("COMMIT", (err) => {
        if (err) {
            console.error("❌ Erro ao finalizar transação:", err.message);
        } else {
            console.log("\n🚀 Banco de dados resetado com sucesso! Pronto para começar.");
            console.log("Dica: Se o servidor estiver rodando, reinicie-o.");
        }
    });
});