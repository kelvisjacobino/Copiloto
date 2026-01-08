const API = 'http://localhost:3000/api';

async function carregarErros() {
  const tbody = document.getElementById('listaErros');

  try {
    const res = await fetch(`${API}/erros`);
    const erros = await res.json();

    tbody.innerHTML = '';

 if (!data.erros || data.erros.length === 0) {
  lista.innerHTML = `
    <li class="list-group-item list-group-item-success">
      🎉 Nenhum erro registrado até agora
    </li>
  `;
  return;
}


    data.erros.forEach(e => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${e.disciplina}</td>
        <td>${e.conteudo}</td>
        <td>${e.enunciado}</td>
        <td>${e.data}</td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-danger text-center">
          Erro ao carregar dados
        </td>
      </tr>
    `;
  }
}

document.addEventListener('DOMContentLoaded', carregarErros);
