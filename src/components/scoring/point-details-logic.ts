import type {
  RallySituacao,
  RallyTipo,
  RallyGolpe,
  RallySubtipo1,
  RallySubtipo2,
  RallyEfeito,
  RallyDirecao,
  RallyGolpeEsp,
} from '@/core/scoring/types';

export type Vencedor = 'sacador' | 'devolvedor';

export interface PointDetailsForm {
  situacao: RallySituacao | null;
  tipo: RallyTipo | null;
  golpe: RallyGolpe | null;
  subtipo1: RallySubtipo1 | null;
  subtipo2: RallySubtipo2 | null;
  efeito: RallyEfeito | null;
  direcao: RallyDirecao | null;
  golpeEsp: RallyGolpeEsp | null;
  ballClicks: number;
}

export type Action =
  | { type: 'SET_SITUACAO'; value: RallySituacao }
  | { type: 'SET_TIPO'; value: RallyTipo }
  | { type: 'SET_GOLPE'; value: RallyGolpe }
  | { type: 'SET_SUBTIPO1'; value: RallySubtipo1 }
  | { type: 'SET_SUBTIPO2'; value: RallySubtipo2 }
  | { type: 'SET_EFEITO'; value: RallyEfeito }
  | { type: 'SET_DIRECAO'; value: RallyDirecao }
  | { type: 'SET_GOLPE_ESP'; value: RallyGolpeEsp }
  | { type: 'SET_BALL_CLICKS'; value: number }
  | { type: 'RESET' };

export const initialForm: PointDetailsForm = {
  situacao: null,
  tipo: null,
  golpe: null,
  subtipo1: null,
  subtipo2: null,
  efeito: null,
  direcao: null,
  golpeEsp: null,
  ballClicks: 1,
};

export function formReducer(state: PointDetailsForm, action: Action): PointDetailsForm {
  switch (action.type) {
    case 'SET_SITUACAO':
      return { ...initialForm, ballClicks: state.ballClicks, situacao: action.value };
    case 'SET_TIPO':
      return { ...state, tipo: action.value, golpe: null, subtipo1: null, subtipo2: null, efeito: null, direcao: null, golpeEsp: null };
    case 'SET_GOLPE':
      return { ...state, golpe: action.value, subtipo1: null, subtipo2: null, efeito: null, direcao: null, golpeEsp: null };
    case 'SET_SUBTIPO1':
      return { ...state, subtipo1: action.value, subtipo2: null, efeito: null, direcao: null, golpeEsp: null };
    case 'SET_SUBTIPO2':
      return { ...state, subtipo2: action.value, efeito: null, direcao: null, golpeEsp: null };
    case 'SET_EFEITO':
      return { ...state, efeito: action.value, direcao: null, golpeEsp: null };
    case 'SET_DIRECAO':
      return { ...state, direcao: action.value, golpeEsp: null };
    case 'SET_GOLPE_ESP':
      return { ...state, golpeEsp: action.value };
    case 'SET_BALL_CLICKS':
      return { ...state, ballClicks: action.value };
    case 'RESET':
      return initialForm;
    default:
      return state;
  }
}

export function calculateFinalBallExchanges(clicks: number, devolvedorVenceu: boolean): number {
  const balls = Math.max(1, clicks);
  return devolvedorVenceu ? balls + 1 : balls;
}

export const SITUACAO_OPTIONS: { value: RallySituacao; label: string }[] = [
  { value: 'devolucao', label: 'Devolução de Saque' },
  { value: 'fundo', label: 'Fundo de Quadra' },
  { value: 'passada', label: 'Passada' },
  { value: 'rede', label: 'Rede' },
];

export const TIPO_LABELS: Record<RallyTipo, string> = {
  winner: 'Winner',
  erro_nao_forcado: 'Erro Não Forçado',
  erro_forcado: 'Erro Forçado',
};

export const TIPO_DESCRIPTIONS: Record<RallyTipo, string> = {
  winner: 'Venceu com uma bola ganhadora, sem erro do adversário',
  erro_nao_forcado: 'Errou sem pressão do adversário (erro próprio)',
  erro_forcado: 'Errou em decorrência de pressão adversária (erro forçado)',
};

export const GOLPE_LABELS: Record<RallyGolpe, string> = {
  fh: 'Forehand (FH)',
  bh: 'Backhand (BH)',
  vfh: 'Voleio FH',
  vbh: 'Voleio BH',
  smash: 'Smash',
};

export function getTipoOptions(vencedor: Vencedor, situacao: RallySituacao): RallyTipo[] {
  if (vencedor === 'sacador' && situacao === 'devolucao') return ['erro_nao_forcado', 'erro_forcado'];
  if (vencedor === 'devolvedor' && situacao === 'devolucao') return ['winner'];
  return ['erro_nao_forcado', 'erro_forcado', 'winner'];
}

export function getGolpeOptions(vencedor: Vencedor, situacao: RallySituacao, tipo: RallyTipo): RallyGolpe[] {
  if (vencedor === 'sacador' && (situacao === 'fundo' || situacao === 'devolucao')) return ['fh', 'bh'];
  if (vencedor === 'sacador' && situacao === 'passada' && tipo !== 'winner') return ['vfh', 'vbh', 'smash'];
  if (vencedor === 'sacador' && situacao === 'passada' && tipo === 'winner') return ['fh', 'bh'];
  if (vencedor === 'sacador' && situacao === 'rede' && tipo !== 'winner') return ['fh', 'bh'];
  if (vencedor === 'sacador' && situacao === 'rede' && tipo === 'winner') return ['vfh', 'vbh', 'smash'];
  if (vencedor === 'devolvedor' && (situacao === 'fundo' || situacao === 'devolucao')) return ['fh', 'bh'];
  if (vencedor === 'devolvedor' && situacao === 'passada' && tipo === 'winner') return ['fh', 'bh'];
  if (vencedor === 'devolvedor' && situacao === 'passada' && tipo !== 'winner') return ['vfh', 'vbh', 'smash'];
  if (vencedor === 'devolvedor' && situacao === 'rede' && tipo !== 'winner') return ['fh', 'bh'];
  if (vencedor === 'devolvedor' && situacao === 'rede' && tipo === 'winner') return ['vfh', 'vbh', 'smash'];
  return ['fh', 'bh'];
}

export function shouldShowSubtipo1(vencedor: Vencedor, situacao: RallySituacao, tipo: RallyTipo): boolean {
  return vencedor === 'sacador' && situacao === 'rede' && tipo !== 'winner';
}

export const SUBTIPO1_OPTIONS: { value: RallySubtipo1; label: string }[] = [
  { value: 'passing_shot', label: 'Passing Shot' },
  { value: 'devolucao_saque', label: 'Devolução de Saque' },
];

export function shouldShowSubtipo2(situacao: RallySituacao, tipo: RallyTipo, golpe: RallyGolpe): boolean {
  return situacao === 'passada' && tipo !== 'winner' && (golpe === 'vbh' || golpe === 'vfh' || golpe === 'smash');
}

export const SUBTIPO2_OPTIONS: { value: RallySubtipo2; label: string }[] = [
  { value: 'out', label: 'Fora (Out)' },
  { value: 'net', label: 'Na Rede (Net)' },
];

export function shouldShowEfeito(
  vencedor: Vencedor,
  situacao: RallySituacao,
  tipo: RallyTipo,
  subtipo1Filled: boolean,
  subtipo2Filled: boolean,
): boolean {
  if (situacao === 'passada' && tipo !== 'winner') return false;
  if (situacao === 'rede' && tipo === 'winner') return false;
  return true;
}

export const EFEITO_OPTIONS: { value: RallyEfeito; label: string }[] = [
  { value: 'topspin', label: 'Topspin' },
  { value: 'slice', label: 'Slice' },
  { value: 'flat', label: 'Flat' },
];

export function getDirecaoOptions(efeito: RallyEfeito | null, situacao: RallySituacao, tipo: RallyTipo): RallyDirecao[] {
  if (efeito === 'slice') return ['cruzada', 'paralela', 'centro'];
  if (situacao === 'passada' && tipo !== 'winner') return ['cruzada', 'paralela', 'centro'];
  if (situacao === 'rede' && tipo === 'winner') return ['cruzada', 'paralela', 'centro'];
  return ['cruzada', 'paralela', 'centro', 'inside_out', 'inside_in'];
}

export const DIRECAO_LABELS: Record<RallyDirecao, string> = {
  cruzada: 'Cruzada',
  paralela: 'Paralela',
  centro: 'Centro',
  inside_out: 'Inside-out',
  inside_in: 'Inside-in',
};

export function getGolpeEspOptions(
  golpe: RallyGolpe,
  efeito: RallyEfeito | null,
  vencedor: Vencedor,
  situacao: RallySituacao,
  tipo: RallyTipo,
  subtipo2: RallySubtipo2 | null,
  direcao: RallyDirecao | null,
): RallyGolpeEsp[] {
  if (golpe === 'smash') return [];
  if (efeito === 'flat') return [];
  if (efeito === 'slice') return ['lob', 'drop_shot'];
  if ((golpe === 'vbh' || golpe === 'vfh') && !efeito) {
    if (vencedor === 'devolvedor') return ['drop_shot', 'bate_pronto', 'swing_volley'];
    if (vencedor === 'sacador' && subtipo2 && (subtipo2 === 'out' || subtipo2 === 'net') && direcao && ['cruzada', 'paralela', 'centro'].includes(direcao)) {
      return ['drop_shot', 'bate_pronto', 'swing_volley'];
    }
    if (vencedor === 'sacador' && ((situacao === 'rede' && tipo === 'winner') || (situacao === 'passada' && tipo !== 'winner'))) {
      return ['lob', 'drop_shot', 'bate_pronto', 'swing_volley'];
    }
  }
  if (efeito === 'topspin') {
    if (vencedor === 'devolvedor' && situacao === 'fundo') return [];
    if (tipo === 'winner') return ['lob'];
    if (vencedor === 'sacador' && situacao === 'rede') return ['lob'];
    if (vencedor === 'sacador' && situacao === 'fundo') return ['lob', 'drop_shot', 'bate_pronto'];
    return [];
  }
  return [];
}

export const GOLPE_ESP_LABELS: Record<RallyGolpeEsp, string> = {
  lob: 'Lob',
  drop_shot: 'Drop Shot',
  bate_pronto: 'Bate-pronto',
  swing_volley: 'Swing Volley',
};
