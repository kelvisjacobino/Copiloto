const OpenAI = require('openai');
const db = require('../database/db');

let client = null;

// ===============================
// CONFIGURAÇÃO OPENAI
// ===============================
console.log('🔑 OPENAI_API_KEY:', process.env.OPENAI_API_KEY);

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
} else {
  console.warn('⚠️ OPENAI_API_KEY não configurada. Usando modo MOCK.');
}

// ===============================
// NORMALIZAÇÃO DEFINITIVA DE ALTERNATIVAS
// ===============================
function normalizarAlternativas(alternativas) {
  const PADRAO = 'Alternativa não informada';

  let A = PADRAO;
  let B = PADRAO;
  let C = PADRAO;
  let D = PADRAO;
  let E = null;

  // Caso venha array
  if (Array.isArray(alternativas)) {
    A = alternativas[0] ? String(alternativas[0]).trim() : PADRAO;
    B = alternativas[1] ? String(alternativas[1]).trim() : PADRAO;
    C = alternativas[2] ? String(alternativas[2]).trim() : PADRAO;
    D = alternativas[3] ? String(alternativas[3]).trim() : PADRAO;
    E = alternativas[4] ? String(alternativas[4]).trim() : null;
  }

  // Caso venha objeto
  else if (alternativas && typeof alternativas === 'object') {
    A = alternativas.A ? String(alternativas.A).trim() : PADRAO;
    B = alternativas.B ? String(alternativas.B).trim() : PADRAO;
    C = alternativas.C ? String(alternativas.C).trim() : PADRAO;
    D = alternativas.D ? String(alternativas.D).trim() : PADRAO;
    E = alternativas.E ? String(alternativas.E).trim() : null;
  }

  // 🔒 GARANTIA ABSOLUTA (SQLite-safe)
  if (!A || A === '') A = PADRAO;
  if (!B || B === '') B = PADRAO;
  if (!C || C === '') C = PADRAO;
  if (!D || D === '') D = PADRAO;

  return { A, B, C, D, E };
}

// ===============================
// EXTRAIR JSON DA IA (ROBUSTO)
// ===============================
function extrairJSON(texto) {
  if (!texto || typeof texto !== 'string') {
    throw new Error('Resposta vazia da IA');
  }

  try {
    return JSON.parse(texto);
  } catch (_) {}

  const match = texto.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) {
    throw new Error('JSON não encontrado na resposta da IA');
  }

  return JSON.parse(match[0]);
}

// ===============================
// GERAR MATERIAL DE ESTUDO
// ===============================
async function gerarMaterial({ disciplina, conteudo }) {

  // 🟡 MODO DEV — não consome IA
  if (!client || process.env.USE_AI === 'false') {
    console.warn('🟡 IA DESATIVADA (DEV)');
    return {
      subtopicos: ['Introdução', 'Conceitos principais'],
      material: `📘 ${disciplina} — ${conteudo}\nMaterial de teste.`,
      questoes: []
    };
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
Priorize conceitos, classificações e definições que a FGV costuma explorar
em provas, SEM extrapolar o escopo do conteúdo informado.

Regras do material:
- Linguagem técnica, clara e direta
- Não citar temas que não sejam necessários ao entendimento do conteúdo
- Destacar em **negrito** termos que costumam ser usados como armadilhas
- O material deve ser AUTOSSUFICIENTE para responder às questões

════════════════════════════════════
ETAPA 2 — QUESTÕES (PADRÃO FGV)
════════════════════════════════════

Com base EXCLUSIVA no material acima, crie exatamente 15 questões objetivas
no padrão da banca FGV.

REGRAS OBRIGATÓRIAS DAS QUESTÕES:
- Todas as respostas devem estar contidas ou inferíveis a partir do material
- NÃO cobrar conceitos, siglas ou classificações que não apareçam no texto
- NÃO exigir conhecimento externo ao material

CARACTERÍSTICAS DAS QUESTÕES:
- Enunciados situacionais (ex: “Em determinado órgão público...”, “Um analista de TI...”)
- Distratores fortes, conceitualmente próximos
- Apenas UMA alternativa correta
- 5 alternativas (A, B, C, D, E)

COMENTÁRIOS:
- Explicar por que a alternativa correta está correta
- Explicar por que as demais alternativas estão erradas ou incompletas,
  conforme o estilo da FGV

════════════════════════════════════
FORMATO DE RESPOSTA (SOMENTE JSON)
════════════════════════════════════

{
  "subtopicos": [],
  "material": "",
  "questoes": [
    {
      "enunciado": "",
      "alternativas": {
        "A": "",
        "B": "",
        "C": "",
        "D": "",
        "E": ""
      },
      "resposta_correta": "A",
      "comentario": ""
    }
  ]
}





`;

    const response = await client.responses.create({
      model: 'gpt-4o-mini',
      input: prompt,
      temperature: 0.4
    });

    const textoIA =
      response.output_text ||
      response.output?.[0]?.content?.[0]?.text;

    const resultado = extrairJSON(textoIA);
    return resultado;

  } catch (err) {
    console.error('❌ ERRO REAL DA IA:', err);
    return {
      subtopicos: ['Revisão', 'Conceitos-chave'],
      material: `📘 ${disciplina} — ${conteudo}\nMaterial temporário.`,
      questoes: []
    };
  }
}

// ===============================
// GERAR QUESTÕES DE REFORÇO
// ===============================
async function gerarQuestoesIA(conteudosIds = []) {
  if (!client || !Array.isArray(conteudosIds)) return 0;

  let total = 0;

  for (const conteudoId of conteudosIds) {
    const conteudo = await new Promise(resolve => {
      db.get(
        `SELECT titulo FROM conteudos WHERE id = ?`,
        [conteudoId],
        (_, row) => resolve(row)
      );
    });

    if (!conteudo) continue;

    try {
      const prompt = `
Crie 2 questões estilo FGV sobre:
"${conteudo.titulo}"

Retorne SOMENTE JSON no formato:
[
  {
    "enunciado": "",
    "alternativas": [],
    "resposta_correta": "",
    "comentario": ""
  }
]
`;

      const response = await client.responses.create({
        model: 'gpt-4o-mini',
        input: prompt,
        temperature: 0.3
      });

      const textoIA =
        response.output_text ||
        response.output?.[0]?.content?.[0]?.text;

      const questoes = extrairJSON(textoIA);

      questoes.forEach(q => {
        if (!q || !q.enunciado) {
          console.warn('⚠️ QUESTÃO IGNORADA (inválida):', q);
          return;
        }

        const alt = normalizarAlternativas(q.alternativas);

        // 🧪 DEBUG CRÍTICO
        console.log('🧪 DEBUG INSERT QUESTÃO:', {
          enunciado: q.enunciado,
          alternativas: alt
        });

      db.run(`
  INSERT INTO questoes (
    conteudo_id,
    enunciado,
    alternativa_a,
    alternativa_b,
    alternativa_c,
    alternativa_d,
    alternativa_e,
    correta,
    comentario
  ) VALUES (
    ?,
    ?,
    COALESCE(NULLIF(?, ''), 'Alternativa não informada'),
    COALESCE(NULLIF(?, ''), 'Alternativa não informada'),
    COALESCE(NULLIF(?, ''), 'Alternativa não informada'),
    COALESCE(NULLIF(?, ''), 'Alternativa não informada'),
    NULLIF(?, ''),
    COALESCE(NULLIF(?, ''), 'A'),
    ?
  )
`, [
  conteudoId,
  q.enunciado,
  alt.A,
  alt.B,
  alt.C,
  alt.D,
  alt.E,
  q.correta || q.resposta_correta,
  q.comentario || null
]);

        total++;
      });

    } catch (err) {
      console.warn(`⚠️ Erro ao gerar questões para conteúdo ${conteudoId}`, err);
    }
  }

  return total;
}

module.exports = {
  gerarMaterial,
  gerarQuestoesIA
};
