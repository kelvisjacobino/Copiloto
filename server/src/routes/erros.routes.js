const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
    // Query simplificada para testar se as tabelas existem
    const sql = `
        SELECT h.id, c.titulo as conteudo, h.data_estudo as data
        FROM historico_estudos h
        JOIN conteudos c ON h.conteudo_id = c.id
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("❌ ERRO NO SQL:", err.message); // Isso vai aparecer no seu terminal
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

module.exports = router;