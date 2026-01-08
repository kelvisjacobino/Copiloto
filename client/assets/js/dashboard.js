// ===============================
// CONFIGURAÇÃO GERAL
// ===============================
const API = 'http://localhost:3000/api';

let disciplinaIdHoje = null;
let acaoHoje = null;
let conteudoIdHoje = null;



// ===============================
// FUNÇÃO: CARREGAR PLANO DE HOJE
// ===============================
async function carregarPlanoHoje() {
  const planoDiv = document.getElementById('planoHoje');
  const progressoTexto = document.getElementById('progressoTexto');
  const barra = document.getElementById('barraProgresso');

  if (!planoDiv) return;

  try {
    const res = await fetch(`${API}/plano/hoje`);
    const data = await res.json();
    acaoHoje = data.acao;
disciplinaIdHoje = data.disciplina_id || null;
conteudoIdHoje = data.conteudo_id || null;


    // 🔴 Dia sem estudo
    if (data.message) {
      planoDiv.innerHTML = `<p>${data.message}</p>`;
      acaoHoje = null;
      disciplinaIdHoje = null;
      return;
    }

    // 🔵 Dados principais
    acaoHoje = data.acao;
    disciplinaIdHoje = data.disciplina_id || null;

    planoDiv.innerHTML = `
      <p><strong>Dia:</strong> ${data.dia}</p>
      <p><strong>Disciplina:</strong> ${data.disciplina}</p>
      <p><strong>Conteúdo:</strong> ${data.conteudo}</p>
      <p><strong>Ação:</strong> ${
        data.acao === 'reforco'
          ? '🔁 Reforço'
          : data.acao === 'revisao'
          ? '🧠 Revisão'
          : '📘 Estudo'
      }</p>
    `;

    // 🔵 Progresso
    if (progressoTexto && barra && data.total_conteudos > 0) {
      const percentual = Math.round(
        (data.concluidos / data.total_conteudos) * 100
      );

      progressoTexto.innerText =
        `Progresso: ${data.concluidos} de ${data.total_conteudos} conteúdos`;

      barra.style.width = `${percentual}%`;
      barra.innerText = `${percentual}%`;
    } else if (barra) {
      barra.style.width = '0%';
      barra.innerText = '';
    }

  } catch (err) {
    console.error(err);
    planoDiv.innerHTML =
      `<p class="text-danger">Erro ao carregar plano do dia</p>`;
  }
}

// ===============================
// FUNÇÃO: CARREGAR TRILHA
// ===============================
async function carregarTrilha() {
  const ul = document.getElementById('listaTrilha');
  if (!ul) return;

  ul.innerHTML = '';

  try {
    const res = await fetch(`${API}/plano/trilha`);
    const data = await res.json();

    // 🔴 Sem trilha (domingo / descanso)
    if (!Array.isArray(data.trilha)) {
      ul.innerHTML = `
        <li class="list-group-item text-muted">
          Nenhuma trilha disponível para hoje
        </li>
      `;
      return;
    }

    // 🔵 Render trilha real
    data.trilha.forEach(item => {
      const li = document.createElement('li');
      li.classList.add('list-group-item');

      if (item.status === 'estudado') {
        li.classList.add('list-group-item-success');
        li.innerText = `✔️ ${item.titulo}`;
      } else if (item.status === 'reforco') {
        li.classList.add('list-group-item-warning');
        li.innerText = `🔁 ${item.titulo}`;
      } else {
        li.innerText = `⏳ ${item.titulo}`;
      }

      ul.appendChild(li);
    });

  } catch (err) {
    console.error(err);
    ul.innerHTML = `
      <li class="list-group-item text-danger">
        Erro ao carregar trilha
      </li>
    `;
  }
}

// ===============================
// BOTÃO: INICIAR ESTUDO
// ===============================
function configurarBotaoEstudo() {
  const btn = document.getElementById('btnEstudar');
  if (!btn) return;

  btn.addEventListener('click', () => {

    // 🟡 Domingo → revisão
    if (acaoHoje === 'revisao') {
      window.location.href = 'revisao.html';
      return;
    }

    // 🔴 Nada planejado
    if (!acaoHoje) {
      alert('Nenhum estudo planejado para hoje');
      return;
    }

    // 🔵 Estudo normal / reforço
    if (!conteudoIdHoje) {
  alert('Conteúdo do dia não definido.');
  return;
}

window.location.href = `estudo.html?conteudo_id=${conteudoIdHoje}`;

  });
}

// ===============================
// INICIALIZAÇÃO
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  carregarPlanoHoje();
  carregarTrilha();
  configurarBotaoEstudo();
});
