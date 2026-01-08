const API = 'http://localhost:3000/api';

// Pega parâmetros da URL
const params = new URLSearchParams(window.location.search);
const tipo = params.get('tipo') || 'geral'; // diario | geral
const disciplinaId = params.get('disciplina_id');

let simuladoId = null;
let questoes = [];

/**
 * Inicia o simulado
 */
async function iniciarSimulado() {
  try {
    let url = `${API}/simulados/${tipo}`;
    let body = {};

    if (tipo === 'diario') {
      if (!disciplinaId) {
        alert('disciplina_id não informado');
        return;
      }
      body.disciplina_id = Number(disciplinaId);
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    simuladoId = data.simulado_id;
    questoes = data.questoes || [];

    document.getElementById('tituloSimulado').innerText =
      tipo === 'diario'
        ? 'Simulado do Dia'
        : 'Simulado Geral';

    document.getElementById('infoSimulado').innerText =
      `${questoes.length} questões`;

    renderizarQuestoes();

  } catch (err) {
    console.error(err);
    alert('Erro ao iniciar simulado');
  }
}

/**
 * Renderiza questões na tela
 */
function renderizarQuestoes() {
  const container = document.getElementById('listaQuestoes');
  container.innerHTML = '';

  if (questoes.length === 0) {
    container.innerHTML = `
      <div class="alert alert-warning">
        Nenhuma questão disponível para este simulado.
      </div>
    `;
    return;
  }

  questoes.forEach((q, index) => {
    const card = document.createElement('div');
    card.className = 'card shadow-sm mb-3';

    card.innerHTML = `
      <div class="card-body">
        <p><strong>${index + 1}.</strong> ${q.enunciado}</p>

        ${['a','b','c','d','e'].map(letra => {
          const texto = q[`alternativa_${letra}`];
          if (!texto) return '';
          return `
            <div class="form-check">
              <input
                class="form-check-input"
                type="radio"
                name="q${q.id}"
                value="${letra.toUpperCase()}"
              >
              <label class="form-check-label">
                ${letra.toUpperCase()}) ${texto}
              </label>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.appendChild(card);
  });
}

/**
 * Finaliza simulado
 */
async function finalizarSimulado() {
  if (!simuladoId) {
    alert('Simulado inválido');
    return;
  }

  const respostas = [];

  questoes.forEach(q => {
    const marcada = document.querySelector(
      `input[name="q${q.id}"]:checked`
    );

    if (marcada) {
      respostas.push({
        questao_id: q.id,
        resposta: marcada.value
      });
    }
  });

  if (respostas.length === 0) {
    alert('Responda ao menos uma questão');
    return;
  }

  try {
    const res = await fetch(`${API}/simulados/finalizar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        simulado_id: simuladoId,
        respostas
      })
    });

    const data = await res.json();

  localStorage.setItem('resultadoSimulado', JSON.stringify(data));
window.location.href = 'resultado.html';


    // Volta para dashboard
    window.location.href = 'dashboard.html';

  } catch (err) {
    console.error(err);
    alert('Erro ao finalizar simulado');
  }
}

// EVENTOS
document
  .getElementById('btnFinalizar')
  .addEventListener('click', finalizarSimulado);

document.addEventListener('DOMContentLoaded', iniciarSimulado);
