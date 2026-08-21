import type {
  RallySituacao,
  RallyTipo,
  RallyGolpe,
  RallySubtipo1,
  RallySubtipo2,
  RallyEfeito,
  RallyDirecao,
  RallyGolpeEsp,
  RallyDuration,
} from '@/core/scoring/types';
import {
  resolveGolpeEspOptions,
  resolveGolpeOptions,
} from './point-details-options.helpers';

export type { RallyDuration };
export type Vencedor = 'sacador' | 'devolvedor';

export interface PointDetailsForm {
  situacao: RallySituacao | null;
  tipo: RallyTipo | null;
  golpe: RallyGolpe | null;
  subtipo1: RallySubtipo1 | null;
  subtipo2: RallySubtipo2 | null;
  efeito: RallyEfeito | null;
  duracao: RallyDuration | null;
  direcao: RallyDirecao | null;
  golpeEsp: RallyGolpeEsp | null;
}

export type Action =
  | { type: 'SET_SITUACAO'; value: RallySituacao }
  | { type: 'SET_TIPO'; value: RallyTipo }
  | { type: 'SET_GOLPE'; value: RallyGolpe }
  | { type: 'SET_DURACAO'; value: RallyDuration }
  | { type: 'SET_SUBTIPO1'; value: RallySubtipo1 }
  | { type: 'SET_SUBTIPO2'; value: RallySubtipo2 }
  | { type: 'SET_EFEITO'; value: RallyEfeito }
  | { type: 'SET_DIRECAO'; value: RallyDirecao }
  | { type: 'SET_GOLPE_ESP'; value: RallyGolpeEsp }
  | { type: 'RESET' };

export const initialForm: PointDetailsForm = {
  situacao: null,
  tipo: null,
  golpe: null,
  subtipo1: null,
  subtipo2: null,
  efeito: null,
  duracao: null,
  direcao: null,
  golpeEsp: null,
};

type FormActionHandler = (state: PointDetailsForm, action: any) => PointDetailsForm;

const FORM_ACTION_HANDLERS: Record<string, FormActionHandler> = {
  SET_SITUACAO: (_state, action) => ({ ...initialForm, situacao: action.value }),
  SET_TIPO: (state, action) => ({
    ...state,
    tipo: action.value,
    golpe: null,
    subtipo1: null,
    subtipo2: null,
    efeito: null,
    duracao: null,
    direcao: null,
    golpeEsp: null,
  }),
  SET_GOLPE: (state, action) => ({
    ...state,
    golpe: action.value,
    subtipo1: null,
    subtipo2: null,
    efeito: null,
    duracao: null,
    direcao: null,
    golpeEsp: null,
  }),
  SET_DURACAO: (state, action) => ({ ...state, duracao: action.value }),
  SET_SUBTIPO1: (state, action) => ({
    ...state,
    subtipo1: action.value,
    subtipo2: null,
    efeito: null,
    direcao: null,
    golpeEsp: null,
  }),
  SET_SUBTIPO2: (state, action) => ({
    ...state,
    subtipo2: action.value,
    efeito: null,
    direcao: null,
    golpeEsp: null,
  }),
  SET_EFEITO: (state, action) => ({
    ...state,
    efeito: action.value,
    direcao: null,
    golpeEsp: null,
  }),
  SET_DIRECAO: (state, action) => ({ ...state, direcao: action.value, golpeEsp: null }),
  SET_GOLPE_ESP: (state, action) => ({ ...state, golpeEsp: action.value }),
  RESET: () => initialForm,
};

export function formReducer(state: PointDetailsForm, action: Action): PointDetailsForm {
  return FORM_ACTION_HANDLERS[action.type]?.(state, action) ?? state;
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
  dupla_falta: 'Dupla Falta',
};

export const TIPO_DESCRIPTIONS: Record<RallyTipo, string> = {
  winner: 'Venceu com uma bola ganhadora, sem erro do adversário',
  erro_nao_forcado: 'Errou sem pressão do adversário (erro próprio)',
  erro_forcado: 'Errou em decorrência de pressão adversária (erro forçado)',
  dupla_falta: 'Dupla falta do sacador (duas faltas consecutivas)',
};

export const GOLPE_LABELS: Record<RallyGolpe, string> = {
  fh: 'Forehand (FH)',
  bh: 'Backhand (BH)',
  vfh: 'Voleio FH',
  vbh: 'Voleio BH',
  smash: 'Smash',
  saque: 'Saque',
};

export function getTipoOptions(vencedor: Vencedor, situacao: RallySituacao): RallyTipo[] {
  if (vencedor === 'sacador' && situacao === 'devolucao') return ['erro_nao_forcado', 'erro_forcado'];
  if (vencedor === 'devolvedor' && situacao === 'devolucao') return ['winner'];
  return ['erro_nao_forcado', 'erro_forcado', 'winner'];
}

export function getGolpeOptions(vencedor: Vencedor, situacao: RallySituacao, tipo: RallyTipo): RallyGolpe[] {
  return resolveGolpeOptions(vencedor, situacao, tipo);
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

export function shouldShowDuracao(situacao: RallySituacao | null, golpe: RallyGolpe | null): boolean {
  if (situacao === 'devolucao' || situacao === 'saque') return false;
  return golpe != null;
}

export const DURACAO_OPTIONS: { value: RallyDuration; label: string }[] = [
  { value: 'opcao_1', label: '3 a 6 bolas' },
  { value: 'opcao_2', label: '7 a 10 bolas' },
  { value: 'opcao_3', label: 'Mais de 11 bolas' },
];

export const SUBTIPO2_OPTIONS: { value: RallySubtipo2; label: string }[] = [
  { value: 'out', label: 'Fora (Out)' },
  { value: 'net', label: 'Na Rede (Net)' },
];

export function shouldShowEfeito(
  _vencedor: Vencedor,
  situacao: RallySituacao,
  tipo: RallyTipo,
  _subtipo1Filled: boolean,
  _subtipo2Filled: boolean,
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
  aberto: 'Aberto',
  fechado: 'Fechado',
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
  return resolveGolpeEspOptions(
    golpe,
    efeito,
    vencedor,
    situacao,
    tipo,
    subtipo2,
    direcao,
  );
}

export const GOLPE_ESP_LABELS: Record<RallyGolpeEsp, string> = {
  lob: 'Lob',
  drop_shot: 'Drop Shot',
  bate_pronto: 'Bate-pronto',
  swing_volley: 'Swing Volley',
};
