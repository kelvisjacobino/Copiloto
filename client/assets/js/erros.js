// Garanta que a constante API está definida (ajuste a porta se necessário)
const API = 'http://localhost:3000/api';

async function carregarErros() {
    const tbody = document.getElementById('listaErros');
    if (!tbody) return;

    try {
        // Faz a chamada para a rota de erros
        const res = await fetch(`${API}/erros`);
        
        // Se o servidor retornar erro (como 404), o fetch não explode, 
        // mas o res.ok será false. Vamos tratar isso aqui:
        if (!res.ok) {
            throw new Error(`Erro no servidor: ${res.status}`);
        }

        const erros = await res.json();
        tbody.innerHTML = '';

        // Verifica se a lista está vazia
        if (!erros || erros.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center p-4 text-muted">
                        🎉 Nenhum tema em reforço por enquanto! Continue assim.
                    </td>
                </tr>
            `;
            return;
        }

        // Preenche a tabela com os dados retornados do banco
        erros.forEach(e => {
            const dataFormatada = e.data_estudo ? new Date(e.data_estudo).toLocaleDateString('pt-BR') : 'Sem data';
            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td><span class="badge bg-secondary">${e.disciplina}</span></td>
                <td class="fw-bold">${e.conteudo}</td>
                <td class="text-muted small">${dataFormatada}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-primary" onclick="verRaioX(${e.id})">
                        🔍 Ver Raio-X
                    </button>
                    <a href="estudo.html?conteudo_id=${e.id}" class="btn btn-sm btn-outline-success">
                        🔁 Reestudar
                    </a>
                </td>
            `;

            tbody.appendChild(tr);
        });

        // Atualiza a barra de progresso (opcional se você tiver os IDs na tela)
        atualizarBarraProgresso(erros.length);

    } catch (err) {
        console.error("Erro completo:", err);
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-danger text-center p-4">
                    ❌ Erro ao carregar dados. <br>
                    <small>Verifique se o servidor está rodando em ${API}/erros</small>
                </td>
            </tr>
        `;
    }
}

function atualizarBarraProgresso(totalErros) {
    const barra = document.getElementById('barraSuperacao');
    const texto = document.getElementById('txtProgresso');
    if (!barra || !texto) return;

    // Lógica simples: quanto menos erros, mais perto de 100% (ajuste conforme sua preferência)
    const progresso = Math.max(0, 100 - (totalErros * 5)); 
    barra.style.width = `${progresso}%`;
    barra.innerText = `${progresso}%`;
    texto.innerText = `${totalErros} temas pendentes`;
}

// Inicia o carregamento quando a página abre
document.addEventListener('DOMContentLoaded', carregarErros);