const OpenAI = require('openai');
const db = require('../database/db');

let client = null;

// ===============================
// CONFIGURAÇÃO OPENAI
// ===============================
if (process.env.OPENAI_API_KEY) {
  try {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('🤖 OpenAI conectada com sucesso');
  } catch (err) {
    console.warn('⚠️ Falha ao inicializar OpenAI. Usando modo MOCK.');
    client = null;
  }
}

// ===============================
// NORMALIZAÇÃO E UTILITÁRIOS (Preservados do seu original)
// ===============================
function normalizarAlternativas(alternativas) {
  const PADRAO = 'Alternativa não informada';
  let A = PADRAO, B = PADRAO, C = PADRAO, D = PADRAO, E = null;

  if (Array.isArray(alternativas)) {
    A = alternativas[0] || PADRAO;
    B = alternativas[1] || PADRAO;
    C = alternativas[2] || PADRAO;
    D = alternativas[3] || PADRAO;
    E = alternativas[4] || null;
  } else if (alternativas && typeof alternativas === 'object') {
    A = alternativas.A || PADRAO;
    B = alternativas.B || PADRAO;
    C = alternativas.C || PADRAO;
    D = alternativas.D || PADRAO;
    E = alternativas.E || null;
  }
  return { A, B, C, D, E };
}

function extrairJSON(texto) {
  try { return JSON.parse(texto); } catch (_) {
    const match = texto.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) throw new Error('JSON não encontrado');
    return JSON.parse(match[0]);
  }
}

// ===============================
// GERAR MATERIAL (PROMPT ORIGINAL RESTAURADO)
// ===============================
async function gerarMaterial({ disciplina, conteudo }) {
  if (!client || process.env.USE_AI === 'false') {
    return { subtopicos: ['Teste'], material: 'Modo Dev', questoes: [] };
  }

  try {
    const prompt = `
Persona:
Você é um professor sênior especializado em concursos da Fundação Getulio Vargas (FGV),
com profundo domínio do estilo de cobrança, dos distratores clássicos e das armadilhas
conceituais recorrentes da banca.

Tarefa:
Gerar PRIMEIRO um material de estudo e, EM SEGUIDA, um conjunto de questões
baseadas EXCLUSIVAMENTE nesse material.

════════════════════════════════════
ETAPA 1 — MATERIAL DE ESTUDO
════════════════════════════════════
Disciplina: ${disciplina}
Conteúdo: ${conteudo}

Crie um material teórico denso, porém objetivo, dividido em subtópicos.
Priorize conceitos, classificações e definições que a FGV costuma explorar.

Regras:
- Linguagem técnica, clara e direta
- Destacar em **negrito** termos que costumam ser usados como armadilhas

════════════════════════════════════
ETAPA 2 — QUESTÕES (PADRÃO FGV)
════════════════════════════════════
Com base EXCLUSIVA no material acima, crie exatamente 15 questões objetivas
no padrão da banca FGV.

CARACTERÍSTICAS:
- Enunciados situacionais (ex: “Em determinado órgão público...”)
- Distratores fortes, conceitualmente próximos
- 5 alternativas (A, B, C, D, E)

FORMATO DE RESPOSTA (SOMENTE JSON):
{
  "subtopicos": [],
  "material": "",
  "questoes": [
    {
      "enunciado": "",
      "alternativas": { "A": "", "B": "", "C": "", "D": "", "E": "" },
      "resposta_correta": "A",
      "comentario": ""
    }
  ]
}
`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4
    });

    return extrairJSON(response.choices[0].message.content);
  } catch (err) {
    console.error('❌ Erro:', err);
    throw err;
  }
}

module.exports = { gerarMaterial };