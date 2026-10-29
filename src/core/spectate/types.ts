/**
 * Tipagens do domínio puro de Acompanhamento / Transmissão de partidas.
 * R-03: <= 100 linhas por arquivo.
 */

export type SpectatorFeedStatus =
  | 'NOT_STARTED'
  | 'LIVE'
  | 'NO_SIGNAL'
  | 'PAUSED'
  | 'CATCH_UP'
  | 'FINISHED';

export type SpectatorRhythmKind =
  | 'RALLY_IN_PROGRESS'
  | 'CHANGEOVER_BREAK'
  | 'SET_BREAK'
  | 'WAITING_NEXT_POINT'
  | 'NO_SIGNAL'
  | 'PAUSED'
  | 'FINISHED'
  | 'CLIENT_OFFLINE';

export interface SpectatorRhythmState {
  kind: SpectatorRhythmKind;
  label: string;
  nextPollDelayMs: number;
}

export interface SpectatorPlayerSide {
  label: string;
  members: Array<{ id: string; name: string }>;
}

/**
 * Detalhes do ponto registrados pelo anotador (cascata do modal "Vencedor do Ponto").
 * Lista-branca: observações/notas, áudio e ids de jogadores NÃO entram aqui.
 */
export interface SpectatorPointDetails {
  situacao?: string;
  tipo?: string;
  golpe?: string;
  efeito?: string;
  direcao?: string;
  golpeEsp?: string;
  subtipo1?: string;
  subtipo2?: string;
  duracao?: string;
  isSecondServe?: boolean;
  firstFault?: { serveEffect?: string; direction?: string } | null;
}

export interface SpectatorPoint {
  id: string;
  seq: number;
  setNumber: number;
  gameNumber: number;
  scoreAfter: string;
  winnerSide: 'side1' | 'side2';
  serverSide?: 'side1' | 'side2' | null;
  serverMemberId?: string | null;
  receiverMemberId?: string | null;
  courtSide?: 'deuce' | 'ad' | null;
  hitterId?: string | null;
  type: string;
  details?: SpectatorPointDetails | null;
  isBreakPoint?: boolean;
  receivedLate?: boolean;
}

export interface SpectatorMarker {
  kind: 'SCORE_EDIT' | 'ARRANGEMENT_CHANGE';
  at: string;
  description: string;
  /** Marcador fica depois do ponto com esta sequência (0 = antes do primeiro ponto). */
  afterSeq?: number | null;
  /** Placar antes/depois da edição manual, já em texto legível (ex.: "6-4, 3-2 · game 30-30"). */
  from?: string | null;
  to?: string | null;
}

export interface SpectatorScore {
  sets: Array<{ player1: number; player2: number; tiebreak?: { player1: number; player2: number } | null }>;
  currentGame: { player1: string; player2: string };
  serverSide: 'side1' | 'side2' | null;
  isTiebreak?: boolean;
}

export interface SpectatorMatchMeta {
  id: string;
  state: string;
  format: string;
  matchType: 'SINGLES' | 'DOUBLES';
  startedAt?: string | null;
  finishedAt?: string | null;
  sides: [SpectatorPlayerSide, SpectatorPlayerSide];
  tournamentName?: string | null;
  category?: string | null;
  courtType?: string | null;
  annotatorName?: string | null;
  finishReason?: string | null;
}

export interface SpectatorView {
  match: SpectatorMatchMeta;
  score: SpectatorScore;
  points: SpectatorPoint[];
  markers: SpectatorMarker[];
}

export interface SpectatorCorrectionAlert {
  kind: 'POINT_VOIDED' | 'SCORE_EDIT' | 'ARRANGEMENT_CHANGE';
  message: string;
  from?: string;
  to?: string;
}

