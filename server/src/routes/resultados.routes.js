const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const resultadoController = require('../controllers/resultadoController');

router.post(
  '/resultado-questoes',
  authMiddleware,
  resultadoController.registrarResultado
);

module.exports = router;
