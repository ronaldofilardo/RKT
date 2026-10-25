export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function situacaoLabel(s?: string): string {
  const map: Record<string, string> = { devolucao: 'DEV', fundo: 'FQ', rede: 'Rede', passada: 'Pass', saque: 'Sq' };
  return s ? (map[s] ?? s) : '–';
}

export function golpeLabel(s?: string): string {
  if (!s) return '–';
  const map: Record<string, string> = {
    fh: 'FH',
    bh: 'BH',
    vfh: 'VFH',
    vbh: 'VBH',
    smash: 'Sm',
    approach_fh: 'Ap FH',
    approach_bh: 'Ap BH',
  };
  return map[s] ?? s;
}

export function direcaoLabel(s?: string): string {
  if (!s) return '–';
  const map: Record<string, string> = { cruzada: 'X', paralela: 'Parl', centro: 'Ce', inside_out: 'In Out', inside_in: 'In In', aberto: 'Ab', fechado: 'Fe' };
  return map[s] ?? s;
}

export function efeitoLabel(s?: string): string {
  if (!s) return '–';
  const map: Record<string, string> = { topspin: 'Top', slice: 'Sl', flat: 'Flat' };
  return map[s] ?? s;
}

export function golpeEspLabel(s?: string): string {
  if (!s) return '–';
  const map: Record<string, string> = { lob: 'Lob', drop_shot: 'Drop', bate_pronto: 'bate-pronto', swing_volley: 'SV' };
  return map[s] ?? s;
}

export function subtipo1Label(s?: string): string {
  if (!s) return '–';
  const map: Record<string, string> = { passing_shot: 'Pass', devolucao_saque: 'DEV' };
  return map[s] ?? s;
}

export function subtipo2Label(s?: string): string {
  if (!s) return '–';
  const map: Record<string, string> = { out: 'out', net: 'net' };
  return map[s] ?? s;
}

export function duracaoLabel(s?: string): string {
  if (!s) return '–';
  const map: Record<string, string> = { opcao_1: '1-4', opcao_2: '5-8', opcao_3: '+9' };
  return map[s] ?? s;
}

export function trocasFaixaLabel(rallyLength?: number): string {
  const n = rallyLength ?? 1;
  if (n <= 4) return '1-4';
  if (n <= 8) return '5-8';
  return '+9';
}

export function tipoLabel(s?: string): string {
  if (!s) return '–';
  const map: Record<string, string> = { winner: 'W', erro_nao_forcado: 'ENF', erro_forcado: 'EF', dupla_falta: 'DF' };
  return map[s] ?? s;
}

export function vencedorLabel(s?: string): string {
  if (!s) return '–';
  const map: Record<string, string> = { sacador: 'Sacador', devolvedor: 'Devolvedor' };
  return map[s] ?? s;
}
