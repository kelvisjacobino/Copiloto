const API = 'http://localhost:3000/api';

// 🔹 Recupera dados salvos no estudo
document.addEventListener('DOMContentLoaded', () => {
  const conteudoId = localStorage.getItem('conteudo_id');
  const disciplinaId = localStorage.getItem('disciplina_id');

  if (!conteudoId) {
    alert('Conteúdo não identificado');
    window.location.href = 'dashboard.html';
    return;
  }

  document.getElementById('conteudoId').value = conteudoId;
  document.getElementById('disciplinaId').value = disciplinaId || '';
});

// 🔹 Enviar resultado
document
  .getElementById('formFinalizar')
  .addEventListener('submit', async (e) => {
    e.preventDefault();

    const conteudo_id =
      Number(document.getElementById('conteudoId').value);
    const acertos =
      Number(document.getElementById('acertos').value);
    const total =
      Number(document.getElementById('total').value);
    const tempo_medio =
      Number(document.getElementById('tempo').value || 0);

    if (total === 0) {
      alert('Total de questões não pode ser zero');
      return;
    }

    try {
      const res = await fetch(`${API}/resultado-questoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conteudo_id,
          acertos,
          total,
          tempo_medio
        })
      });

      const data = await res.json();

      alert(
        data.message ||
        'Resultado salvo. Plano será ajustado automaticamente.'
      );

      // limpa estado
      localStorage.removeItem('conteudo_id');
      localStorage.removeItem('disciplina_id');

      // volta para o dashboard
      window.location.href = 'dashboard.html';

    } catch (err) {
      console.error(err);
      alert('Erro ao salvar resultado');
    }
  });
