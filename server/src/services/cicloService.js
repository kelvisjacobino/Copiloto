exports.avaliarResultado = (percentual, tempoMedio) => {
  let acao = '';
  let revisao = '';

  if (percentual < 70) {
    acao = 'reforco_teoria';
    revisao = 'D+1';
  } else if (percentual < 80) {
    acao = 'manter_ciclo';
    revisao = 'D+7';
  } else {
    acao = 'avancar';
    revisao = 'D+30';
  }

  let alertaTempo = false;
  if (tempoMedio && tempoMedio > 120) {
    alertaTempo = true;
  }

  return {
    acao,
    revisao,
    alerta_tempo: alertaTempo
  };
};
