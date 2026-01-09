const path = require('path');
// Ajustando o caminho para apontar para dentro de 'server/src/database/db'
const dbPath = path.join(__dirname, 'server', 'src', 'database', 'db');
const db = require(dbPath); 

// Vamos pegar o primeiro conteúdo que existir no seu banco e marcar como reforço
db.get("SELECT id FROM conteudos LIMIT 1", (err, row) => {
    if (err || !row) {
        console.log("❌ Erro: Você ainda não tem conteúdos cadastrados. Rode o Seed primeiro!");
        return;
    }

    const conteudoId = row.id;
    db.run(
        `INSERT INTO historico_estudos (conteudo_id, status) VALUES (?, 'reforco')`,
        [conteudoId],
        function(err) {
            if (err) console.error(err.message);
            else console.log(`✅ Sucesso! Inserido reforço para o conteúdo ID: ${conteudoId}`);
        }
    );
});