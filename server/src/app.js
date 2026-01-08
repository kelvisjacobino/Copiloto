const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const planoRoutes = require('./routes/plano.routes');
const resultadoRoutes = require('./routes/resultados.routes');
const revisoesRoutes = require('./routes/revisoes.routes');
const estudoRoutes = require('./routes/estudo.routes');




const app = express();

// 🔥 MIDDLEWARES GLOBAIS (TEM QUE VIR ANTES DAS ROTAS)
app.use(cors());
app.use(express.json()); // <-- ISSO É O MAIS IMPORTANTE

// 🔥 ROTAS
app.use('/api/estudo', estudoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/plano', planoRoutes);
app.use('/api', resultadoRoutes);
app.use('/api', revisoesRoutes);

// rota de teste
app.get('/', (req, res) => {
  res.json({ status: 'API ALEGO ONLINE' });
});

module.exports = app;
