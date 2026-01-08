const dados = JSON.parse(localStorage.getItem('resultadoSimulado'));

document.getElementById('acertos').innerText = dados.acertos;
document.getElementById('erros').innerText = dados.erros;
document.getElementById('percentual').innerText = dados.percentual;

document.getElementById('iaFeedback').innerText =
  dados.novas_questoes_geradas > 0
    ? `A IA gerou ${dados.novas_questoes_geradas} novas questões de reforço para você.`
    : 'Ótimo desempenho! Nenhum reforço necessário.';
