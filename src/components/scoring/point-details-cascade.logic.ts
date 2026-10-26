import type {
  RallySituacao, RallyTipo, RallyGolpe, RallySubtipo1,
  RallySubtipo2, RallyEfeito, RallyDirecao, RallyGolpeEsp,
} from '@/core/scoring/types';
import type { Vencedor } from './point-details.types';

export function getTipoOptions(vencedor: Vencedor, situacao: RallySituacao): RallyTipo[] {
  if (vencedor === 'sacador' && situacao === 'devolucao') return ['erro_nao_forcado', 'erro_forcado'];
  if (vencedor === 'devolvedor' && situacao === 'devolucao') return ['winner'];
  return ['erro_nao_forcado', 'erro_forcado', 'winner'];
}

export function getGolpeOptions(_vencedor: Vencedor, situacao: RallySituacao, tipo: RallyTipo): RallyGolpe[] {
  if (situacao === 'fundo' || situacao === 'devolucao') return ['fh', 'bh'];
  if (situacao === 'passada') {
    if (tipo === 'winner') return ['fh', 'bh'];
    return ['vfh', 'vbh', 'smash', 'approach_fh', 'approach_bh'];
  }
  if (situacao === 'rede') {
    if (tipo === 'winner') return ['vfh', 'vbh', 'smash', 'approach_fh', 'approach_bh'];
    return ['fh', 'bh'];
  }
  return ['fh', 'bh'];
}

export function shouldShowSubtipo1(vencedor: Vencedor, situacao: RallySituacao, tipo: RallyTipo): boolean {
  return vencedor === 'sacador' && situacao === 'rede' && tipo !== 'winner';
}

export function shouldShowDuracao(
  situacao: RallySituacao | null,
  golpe: RallyGolpe | null,
  subtipo1: RallySubtipo1 | null = null,
): boolean {
  if (situacao === 'devolucao' || situacao === 'saque') return false;
  // Ponto terminou na devolução do saque (falta na rede indicada via
  // subtipo1="Devolução de Saque") — rally trivial, não perguntar duração.
  if (subtipo1 === 'devolucao_saque') return false;
  return golpe != null;
}

export function shouldShowEfeito(
  _vencedor: Vencedor,
  situacao: RallySituacao,
  tipo: RallyTipo,
  _subtipo1Filled: boolean,
  _subtipo2Filled: boolean,
  golpe?: RallyGolpe | null,
): boolean {
  if (situacao === 'passada' && tipo !== 'winner') return false;
  if (situacao === 'rede' && tipo === 'winner') {
    return golpe === 'approach_fh' || golpe === 'approach_bh';
  }
  return true;
}

export function getDirecaoOptions(efeito: RallyEfeito | null, situacao: RallySituacao, tipo: RallyTipo): RallyDirecao[] {
  if (efeito === 'slice') return ['cruzada', 'paralela', 'centro'];
  if (situacao === 'passada' && tipo !== 'winner') return ['cruzada', 'paralela', 'centro'];
  if (situacao === 'rede' && tipo === 'winner') return ['cruzada', 'paralela', 'centro'];
  return ['cruzada', 'paralela', 'centro', 'inside_out', 'inside_in'];
}

export function getGolpeEspOptions(
  golpe: RallyGolpe,
  efeito: RallyEfeito | null,
  vencedor: Vencedor,
  situacao: RallySituacao,
  tipo: RallyTipo,
  _subtipo2: RallySubtipo2 | null,
  _direcao: RallyDirecao | null,
): RallyGolpeEsp[] {
  if (golpe === 'smash') return [];
  if (efeito === 'flat') return [];
  if (efeito === 'slice') return ['lob', 'drop_shot'];
  if ((golpe === 'vbh' || golpe === 'vfh') && !efeito) {
    if (vencedor === 'devolvedor') return ['drop_shot', 'bate_pronto', 'swing_volley'];
    // passada + erro: o perdedor errou o voleio — lob não é voleio. Sem o
    // "Onde Errou?" (subtipo2), mantém o comportamento final da cascata
    // antiga (3 opções), independentemente de direção já escolhida.
    if (vencedor === 'sacador' && situacao === 'passada' && tipo !== 'winner') {
      return ['drop_shot', 'bate_pronto', 'swing_volley'];
    }
    if (vencedor === 'sacador' && situacao === 'rede' && tipo === 'winner') {
      return ['lob', 'drop_shot', 'bate_pronto', 'swing_volley'];
    }
  }
  if (efeito === 'topspin') {
    if (vencedor === 'devolvedor' && situacao === 'fundo') return [];
    if (tipo === 'winner') return ['lob'];
    if (vencedor === 'sacador' && situacao === 'rede') return ['lob'];
    if (vencedor === 'sacador' && situacao === 'fundo') return ['lob', 'bate_pronto'];
    return [];
  }
  return [];
}
