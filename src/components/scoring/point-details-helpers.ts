import type { RallyEfeito, RallySituacao, RallyTipo, RallyDirecao, RallyGolpeEsp } from '@/core/scoring/types';

export function getDirecaoOptions(
  efeito: RallyEfeito | null,
  situacao: RallySituacao,
  tipo: RallyTipo,
): RallyDirecao[] {
  const options: RallyDirecao[] = [];

  if (efeito) {
    if (['lifted', 'flat'].includes(efeito)) {
      options.push('cruzada', 'paralela', 'inside_out');
    } else if (efeito === 'slice') {
      options.push('cruzada', 'paralela');
    }
  } else if (situacao === 'rede' || tipo === 'winner') {
    options.push('cruzada', 'paralela', 'inside_out', 'centro');
  }

  return options;
}

export function getGolpeEspOptions(
  golpe: string,
  efeito: RallyEfeito | null,
  _vencedor: 'sacador' | 'devolvedor',
  situacao: RallySituacao,
  tipo: RallyTipo,
  _subtipo2: string | null,
  direcao: string | null,
): RallyGolpeEsp[] {
  const options: RallyGolpeEsp[] = [];

  if (golpe === 'forehand' || golpe === 'backhand') {
    if (efeito === 'slice' && situacao === 'fundo') {
      options.push('lob');
    }
    if (direcao === 'insideout') {
      options.push('drop_shot');
    }
  }

  if (golpe === 'volei') {
    options.push('bate_pronto');
  }

  return options;
}