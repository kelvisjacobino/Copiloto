require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// --- 1. MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- 2. ROTAS DA API ---
// Importante: Deixe as APIs antes de servir os arquivos estáticos
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/plano', require('./src/routes/plano.routes'));
app.use('/api/estudo', require('./src/routes/estudo.routes'));
app.use('/api/simulados', require('./src/routes/simulados.routes'));
app.use('/api/erros', require('./src/routes/erros.routes'));

// --- 3. ARQUIVOS ESTÁTICOS ---
// Serve a pasta client (CSS, JS, Imagens)
app.use(express.static(path.join(__dirname, '../client')));

// --- 4. FALLBACK DE NAVEGAÇÃO ---
// Se não encontrar nenhuma rota de API acima, envia o index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// --- 5. INICIALIZAÇÃO ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});