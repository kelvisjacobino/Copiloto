require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// 🔥 SERVIR O FRONTEND
app.use(express.static(path.join(__dirname, '../client')));
app.use('/api/simulados', require('./src/routes/simulados.routes'));
app.use('/api/erros', require('./src/routes/erros.routes'));


// Rotas da API
app.use('/api/auth', require('./src/routes/auth.routes'));
app.use('/api/plano', require('./src/routes/plano.routes'));
app.use('/api/estudo', require('./src/routes/estudo.routes'));

// 🔁 FALLBACK DE NAVEGAÇÃO (IMPORTANTE)
app.get('*', (req, res) => {
  res.sendFile(
    path.join(__dirname, '../client/index.html')
  );
});

// Servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
