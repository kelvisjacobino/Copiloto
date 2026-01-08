const API = 'http://localhost:3000/api';
let simuladoId = null;

document.getElementById('btnSimuladoGeral')
  .addEventListener('click', async () => {

    const res = await fetch(`${API}/simulados/geral`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();
    simuladoId = data.simulado_id;

    const area = document.getElementById('areaSimulado');
    const div = document.getElementById('questoes');

    area.classList.remove('d-none');
    div.innerHTML = '';

    data.questoes.forEach((q, index) => {
      div.innerHTML += `
        <div class="mb-4">
          <p><strong>${index + 1}.</strong> ${q.enunciado}</p>
          ${['A','B','C','D','E'].map(l => q[`alternativa_${l.toLowerCase()}`]
            ? `
            <div class="form-check">
              <input class="form-check-input"
                     type="radio"
                     name="q${index}"
                     value="${l}">
              <label class="form-check-label">
                ${l}) ${q[`alternativa_${l.toLowerCase()}`]}
              </label>
            </div>` : ''
          ).join('')}
        </div>
      `;
    });
  });

document.getElementById('btnFinalizar')
  .addEventListener('click', async () => {

    // ⚠️ simplificado por enquanto
    await fetch(`${API}/simulados/finalizar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        simulado_id: simuladoId,
        respostas: [] // depois coletamos
      })
    });

    alert('Revisão concluída! Reforços atualizados.');
    window.location.href = 'dashboard.html';
  });
