const API = 'http://localhost:3000/api';

let questoes = [];
let respostas = {};
let conteudoIdAtual = null;
let leituraConcluida = false;
const params = new URLSearchParams(window.location.search);
const conteudoIdParam = params.get('conteudo_id');


// ===============================
// UTIL
// ===============================
function dividirEmBlocos(texto) {
  if (!texto) return [];
  return texto.split(/\n\n+/);
}
function renderizarQuestoes() {
  const questoesDiv = document.getElementById('questoes');
  questoesDiv.innerHTML = '';
  respostas = {};

  questoes.forEach((q, index) => {
    const div = document.createElement('div');
    div.className = 'mb-4';

    div.innerHTML = `
      <p><strong>${index + 1}.</strong> ${q.enunciado}</p>

      <button
        class="btn btn-sm btn-outline-primary"
        onclick="carregarAlternativas(${index})"
      >
        🔽 Carregar alternativas
      </button>

      <div id="alternativas-${index}" class="mt-2 d-none"></div>
    `;

    questoesDiv.appendChild(div);
  });
}


function renderizarMaterial(material) {
  const container = document.getElementById('materialBlocos');
  container.innerHTML = '';

  dividirEmBlocos(material).forEach(bloco => {
    const card = document.createElement('div');
    card.className = 'card mb-3';
    card.innerHTML = `
      <div class="card-body">
        <p style="white-space: pre-wrap;">${bloco}</p>
      </div>
    `;
    container.appendChild(card);
  });
}

// ===============================
// CARREGAR ESTUDO
// ===============================
async function carregarEstudoHoje() {
  const url = conteudoIdParam
  ? `${API}/estudo/${conteudoIdParam}`
  : `${API}/estudo/hoje`;

const res = await fetch(url);


  if (!res.ok) {
    const erro = await res.json();
    alert(erro.error || 'Erro ao carregar estudo');
    return;
  }

  const data = await res.json();
  console.log('DATA DA API:', data);

  if (data.message) {
    alert(data.message);
    return;
  }

  document.getElementById('disciplina').innerText = data.disciplina;
  document.getElementById('conteudo').innerText = data.conteudo;

  conteudoIdAtual = data.conteudo_id;
  document.getElementById('btnConfirmarLeitura').disabled = false;

  renderizarMaterial(data.material);

  // Subtópicos
  const ul = document.getElementById('subtopicos');
  ul.innerHTML = '';
  (data.subtopicos || []).forEach(s => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.innerText = s;
    ul.appendChild(li);
  });

  // Questões (LAZY LOAD)
  questoes = data.questoes || [];
  respostas = {};

  const questoesDiv = document.getElementById('questoes');
  questoesDiv.innerHTML = '';

  questoes.forEach((q, index) => {
    const div = document.createElement('div');
    div.classList.add('mb-4');

    div.innerHTML = `
      <p><strong>${index + 1}.</strong> ${q.enunciado}</p>

      <button
        class="btn btn-sm btn-outline-primary"
        onclick="carregarAlternativas(${index})"
      >
        🔽 Carregar alternativas
      </button>

      <div id="alternativas-${index}" class="mt-2 d-none"></div>
    `;

    questoesDiv.appendChild(div);
  });
}

// ===============================
// LAZY LOAD DAS ALTERNATIVAS
// ===============================
function carregarAlternativas(index) {
  const q = questoes[index];
  if (!q) {
    console.error('Questão não encontrada no índice:', index);
    return;
  }

  const container = document.getElementById(`alternativas-${index}`);
  if (!container) {
    console.error('Container não encontrado:', index);
    return;
  }

  // evita carregar duas vezes
  if (!container.classList.contains('d-none')) return;

  console.log('Questão carregada:', q);

  container.innerHTML = `
    ${renderOpcao(index, 'A', q.alternativas?.A || q.alternativa_a)}
    ${renderOpcao(index, 'B', q.alternativas?.B || q.alternativa_b)}
    ${renderOpcao(index, 'C', q.alternativas?.C || q.alternativa_c)}
    ${renderOpcao(index, 'D', q.alternativas?.D || q.alternativa_d)}
    ${
      q.alternativas?.E || q.alternativa_e
        ? renderOpcao(index, 'E', q.alternativas?.E || q.alternativa_e)
        : ''
    }
  `;

  container.classList.remove('d-none');
}


// ===============================
// RENDER OPÇÃO
// ===============================
function renderOpcao(index, letra, texto) {
  if (!texto) {
    console.warn(`Alternativa ${letra} vazia na questão ${index}`);
    return '';
  }

  const textoLimpo = texto.replace(/^[A-E][\.\)]\s*/i, '');

  return `
    <div class="form-check">
      <input
        class="form-check-input"
        type="radio"
        name="q${index}"
        onchange="registrarResposta(${index}, '${letra}')"
      >
      <label class="form-check-label">
        ${letra}) ${textoLimpo}
      </label>
    </div>
  `;
}



function registrarResposta(id, alternativa) {
  respostas[id] = alternativa;
}

// ===============================
// LEITURA
// ===============================
document.getElementById('btnConfirmarLeitura')
  .addEventListener('click', async () => {

    const res = await fetch(`${API}/estudo/leitura`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conteudo_id: conteudoIdAtual })
    });

    if (!res.ok) {
      alert('Erro ao registrar leitura');
      return;
    }

    leituraConcluida = true;

    document.getElementById('areaQuestoes').classList.remove('d-none');
    document.getElementById('btnConfirmarLeitura').disabled = true;

    // ✅ AQUI ESTÁ A CORREÇÃO
    renderizarQuestoes();
  });


// ===============================
// FINALIZAR
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  const btnFinalizar = document.getElementById('btnFinalizar');
  if (!btnFinalizar) return;

  btnFinalizar.addEventListener('click', async () => {
    console.log('🟢 Clique em Finalizar Estudo');

    if (!leituraConcluida) {
      alert('Conclua a leitura antes.');
      return;
    }

    const total = Object.keys(respostas).length;
    if (total === 0) {
      alert('Responda pelo menos uma questão.');
      return;
    }

    const res = await fetch(`${API}/estudo/resultado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conteudo_id: conteudoIdAtual,
        acertos: 0,
        total
      })
    });

    if (!res.ok) {
      const erro = await res.json();
      alert(erro.error || 'Erro ao finalizar estudo');
      return;
    }

    alert('Estudo finalizado!');
    window.location.href = 'dashboard.html';
  });
});


document.addEventListener('DOMContentLoaded', carregarEstudoHoje);
