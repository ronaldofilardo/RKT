import { z } from 'zod';
import type { TimelinePoint } from '@/core/scoring/types';
import {
  enrichPointsFromHistory,
  isBreakPoint,
  isGameBall,
  isSetBall,
  getGameScoreLabel,
} from '@/core/scoring/scoring-logic';
import {
  RallyDetailsSchema,
  RallySituacaoSchema,
  RallyTipoSchema,
  RallyGolpeSchema,
  RallyEfeitoSchema,
  RallyDirecaoSchema,
  RallyGolpeEspSchema,
  type RallyDetails,
} from '@/schemas/contracts';

export { enrichPointsFromHistory, isBreakPoint, isGameBall, isSetBall, getGameScoreLabel } from '@/core/scoring/scoring-logic';

export function filterTimelinePoints(
  points: TimelinePoint[],
  filters: {
    playerWinner?: 'PLAYER_1' | 'PLAYER_2';
    breakPointsOnly?: boolean;
    winnersOnly?: boolean;
    errorsOnly?: boolean;
  },
): TimelinePoint[] {
  return points.filter(p => {
    if (filters.playerWinner && p.winner !== filters.playerWinner) return false;
    if (filters.breakPointsOnly && !p.isBreakPoint) return false;
    if (filters.winnersOnly && p.type !== 'WINNER' && p.type !== 'ACE') return false;
    if (filters.errorsOnly && p.type !== 'UNFORCED_ERROR' && p.type !== 'FORCED_ERROR' && p.type !== 'DOUBLE_FAULT') return false;
    return true;
  });
}

export function countByFilter(points: TimelinePoint[], filter: (p: TimelinePoint) => boolean): number {
  return points.filter(filter).length;
}

export function getGameScoreLabelForPoint(p: TimelinePoint): string {
  const gs = p.gameScore;
  return getGameScoreLabel(gs.player1, gs.player2, p.gameIsDeuce, p.gameAdvantage, p.isTiebreak);
}

export function formatAceOrDf(p: TimelinePoint): string {
  if (p.type === 'ACE') {
    const parts = ['ACE'];
    const rd = p.rallyDetails;
    if (rd?.efeito) {
      const efeitoMap: Record<string, string> = { topspin: 'TOP', slice: 'SLI', flat: 'FLA' };
      parts.push(efeitoMap[rd.efeito] ?? rd.efeito.toUpperCase().slice(0, 3));
    }
    if (rd?.direcao) {
      const dirMap: Record<string, string> = { aberto: 'AB', centro: 'CEN', fechado: 'FEC', cruzada: 'CRU', paralela: 'PAR' };
      parts.push(dirMap[rd.direcao] ?? rd.direcao.toUpperCase().slice(0, 3));
    }
    return parts.join('-');
  }
  if (p.type === 'DOUBLE_FAULT' || p.type === 'FAULT_SECOND') {
    const ff = p.firstFault;
    const firstPart = ff
      ? `1o.${ff.serveEffect ? `-${capitalize(ff.serveEffect.slice(0, 3))}` : ''}${ff.direction ? `-${capitalize(ff.direction.slice(0, 3))}` : ''}`
      : '1o.';
    const rd = p.rallyDetails;
    const secondPart = rd
      ? `2o.${rd.efeito ? `-${capitalize(rd.efeito.slice(0, 3))}` : ''}${rd.direcao ? `-${capitalize(rd.direcao.slice(0, 3))}` : ''}`
      : '2o.';
    return `DF: ${firstPart} > ${secondPart}`;
  }
  return '–';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function situacaoLabel(s?: string): string {
  const map: Record<string, string> = { devolucao: 'Devolução', fundo: 'Fundo', rede: 'Rede', passada: 'Passada' };
  return s ? (map[s] ?? s) : '–';
}

export function golpeLabel(s?: string): string {
  if (!s) return '–';
  const map: Record<string, string> = { fh: 'FH', bh: 'BH', vfh: 'VFH', vbh: 'VBH', smash: 'Smash' };
  return map[s] ?? s;
}

export function direcaoLabel(s?: string): string {
  if (!s) return '–';
  const map: Record<string, string> = { cruzada: 'cruzada', paralela: 'paralela', centro: 'centro', inside_out: 'Inside-Out', inside_in: 'Inside-In', aberto: 'aberto', fechado: 'fechado' };
  return map[s] ?? s;
}

export function efeitoLabel(s?: string): string {
  if (!s) return '–';
  return s;
}

export function golpeEspLabel(s?: string): string {
  if (!s) return '–';
  const map: Record<string, string> = { lob: 'lob', drop_shot: 'drop', bate_pronto: 'bate-pronto', swing_volley: 'swingvolley' };
  return map[s] ?? s;
}

export function subtipo1Label(s?: string): string {
  if (!s) return '–';
  const map: Record<string, string> = { passing_shot: 'Passing Shot', devolucao_saque: 'Devolução' };
  return map[s] ?? s;
}

export function subtipo2Label(s?: string): string {
  if (!s) return '–';
  const map: Record<string, string> = { out: 'out', net: 'net' };
  return map[s] ?? s;
}

export function tipoLabel(s?: string): string {
  if (!s) return '–';
  const map: Record<string, string> = { winner: 'Winner', erro_nao_forcado: 'Erro Não Forçado', erro_forcado: 'Erro Forçado' };
  return map[s] ?? s;
}

export function vencedorLabel(s?: string): string {
  if (!s) return '–';
  const map: Record<string, string> = { sacador: 'Sacador', devolvedor: 'Devolvedor' };
  return map[s] ?? s;
}

export interface FormattedPointDetails {
  short: string;
  full: string;
  tipo: string;
  situacao: string;
  golpe: string;
  direcao: string;
  efeito: string;
  golpeEsp: string;
  subtipo1: string;
  subtipo2: string;
}

export function formatPointDetails(rd?: RallyDetails | null): FormattedPointDetails {
  if (!rd) {
    return {
      short: '–',
      full: '–',
      tipo: '–',
      situacao: '–',
      golpe: '–',
      direcao: '–',
      efeito: '–',
      golpeEsp: '–',
      subtipo1: '–',
      subtipo2: '–',
    };
  }

  const tipo = tipoLabel(rd.tipo);
  const situacao = situacaoLabel(rd.situacao);
  const golpe = golpeLabel(rd.golpe);
  const direcao = direcaoLabel(rd.direcao);
  const efeito = efeitoLabel(rd.efeito);
  const golpeEsp = golpeEspLabel(rd.golpe_esp);
  const subtipo1 = subtipo1Label(rd.subtipo1);
  const subtipo2 = subtipo2Label(rd.subtipo2);
  const vencedor = vencedorLabel(rd.vencedor);

  const parts: string[] = [vencedor];
  parts.push(situacao);
  parts.push(tipo);
  if (rd.golpe) parts.push(golpe);
  if (rd.subtipo1) parts.push(subtipo1);
  if (rd.subtipo2) parts.push(subtipo2);
  if (rd.efeito) parts.push(efeito);
  if (rd.direcao) parts.push(direcao);
  if (rd.golpe_esp) parts.push(golpeEsp);

  return {
    short: `${situacao} • ${golpe}`,
    full: parts.filter(Boolean).join(' • '),
    tipo,
    situacao,
    golpe,
    direcao,
    efeito,
    golpeEsp,
    subtipo1,
    subtipo2,
  };
}

export function formatPointDetailsShort(rd?: RallyDetails | null): string {
  return formatPointDetails(rd).short;
}

export function formatPointDetailsFull(rd?: RallyDetails | null): string {
  return formatPointDetails(rd).full;
}

export function getPointDetailSummary(rd?: RallyDetails | null): {
  label: string;
  color: 'green' | 'red' | 'amber' | 'gray';
} {
  if (!rd) return { label: '–', color: 'gray' };

  if (rd.tipo === 'winner') {
    return { label: 'Winner', color: 'green' };
  }
  if (rd.tipo === 'erro_nao_forcado') {
    return { label: 'ENF', color: 'red' };
  }
  if (rd.tipo === 'erro_forcado') {
    return { label: 'EF', color: 'amber' };
  }
  return { label: tipoLabel(rd.tipo), color: 'gray' };
}

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

export function validateRallyDetails(data: unknown): ValidationResult<z.infer<typeof RallyDetailsSchema>> {
  const result = RallyDetailsSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.') || 'root';
    errors[path] = issue.message;
  }
  return { success: false, errors };
}

export function validateSituacao(value: unknown): ValidationResult<z.infer<typeof RallySituacaoSchema>> {
  return safeEnumValidate(RallySituacaoSchema, value, 'situacao');
}

export function validateTipo(value: unknown): ValidationResult<z.infer<typeof RallyTipoSchema>> {
  return safeEnumValidate(RallyTipoSchema, value, 'tipo');
}

export function validateGolpe(value: unknown): ValidationResult<z.infer<typeof RallyGolpeSchema>> {
  return safeEnumValidate(RallyGolpeSchema, value, 'golpe');
}

export function validateEfeito(value: unknown): ValidationResult<z.infer<typeof RallyEfeitoSchema>> {
  return safeEnumValidate(RallyEfeitoSchema, value, 'efeito');
}

export function validateDirecao(value: unknown): ValidationResult<z.infer<typeof RallyDirecaoSchema>> {
  return safeEnumValidate(RallyDirecaoSchema, value, 'direcao');
}

export function validateGolpeEsp(value: unknown): ValidationResult<z.infer<typeof RallyGolpeEspSchema>> {
  return safeEnumValidate(RallyGolpeEspSchema, value, 'golpe_esp');
}

function safeEnumValidate<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown,
  fieldName: string,
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(value);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: { [fieldName]: result.error.issues[0]?.message ?? 'Invalid value' } };
}

export function isValidRallyDetails(data: unknown): data is z.infer<typeof RallyDetailsSchema> {
  return RallyDetailsSchema.safeParse(data).success;
}
