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
  hitterId: string | null;
  receiverId: string | null;
}

export type Action =
  | { type: 'SET_SITUACAO'; value: RallySituacao }
  | { type: 'SET_TIPO'; value: RallyTipo }
  | { type: 'SET_GOLPE'; value: RallyGolpe }
  | { type: 'SET_DURACAO'; value: RallyDuration | null }
  | { type: 'SET_SUBTIPO1'; value: RallySubtipo1 }
  | { type: 'SET_SUBTIPO2'; value: RallySubtipo2 }
  | { type: 'SET_EFEITO'; value: RallyEfeito }
  | { type: 'SET_DIRECAO'; value: RallyDirecao }
  | { type: 'SET_GOLPE_ESP'; value: RallyGolpeEsp }
  | { type: 'SET_HITTER'; value: string | null }
  | { type: 'SET_RECEIVER'; value: string | null }
  | { type: 'RESET' };
