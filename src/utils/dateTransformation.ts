

export function dateTransformation(dataStr: string): Date {
  const monthMap: Record<string, number> = {
    'jan': 0,
    'fev': 1,
    'mar': 2,
    'abr': 3,
    'mai': 4,
    'jun': 5,
    'jul': 6,
    'ago': 7,
    'set': 8,
    'out': 9,
    'nov': 10,
    'dez': 11
  };
  const agora = new Date();
  const partes = dataStr.split(', ');

  if (partes.length !== 2) {
    throw new Error('Formato de data inválido: ' + dataStr);
  }

  let data: Date;

  if (partes[0] === 'Hoje') {
    data = agora;
  } else if (partes[0] === 'Ontem') {
    data = new Date(agora);
    data.setDate(agora.getDate() - 1);
  } else {
    const diaMes = partes[0].split(' de ');
    const mes = monthMap[diaMes[1]];

    if (diaMes.length !== 2 || mes === undefined) {
      throw new Error('Formato de mês inválido: ' + dataStr);
    }

    const horaMinuto = partes[1].split(':');
    const dia = parseInt(diaMes[0]);
    const hora = parseInt(horaMinuto[0]);
    const minuto = parseInt(horaMinuto[1]);

    data = new Date();
    data.setDate(dia);
    data.setMonth(mes);
    data.setHours(hora);
    data.setMinutes(minuto);
  }

  return data;
}
