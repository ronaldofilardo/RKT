import type { TimelinePoint } from '@/core/scoring/types';
import type { SpectatorPoint } from '@/core/spectate';
import { formatAceOrDf } from '@/components/scoring/timeline-format-ace-df';
import {
  situacaoLabel,
  tipoLabel,
  golpeLabel,
  efeitoLabel,
  direcaoLabel,
  golpeEspLabel,
  subtipo1Label,
  subtipo2Label,
  duracaoLabel,
} from '@/components/scoring/timeline-format-labels';

export type DetailTone = 'green' | 'red' | 'amber' | 'gray';
export interface DetailChip {
  text: string;
  tone: DetailTone;
}

const TIPO_TONE: Record<string, DetailTone> = {
  winner: 'green',
  erro_nao_forcado: 'red',
  erro_forcado: 'amber',
  dupla_falta: 'red',
};

/**
 * Chips da cascata do ponto com as MESMAS abreviações da timeline do anotador
 * (timeline-format-labels / timeline-format-ace-df). Ordem da cascata:
 * situação › resultado › golpe › efeito › direção › especial › duração.
 * Sem detalhes registrados → lista vazia.
 */
export function buildSpectatorDetailChips(point: SpectatorPoint): DetailChip[] {
  const d = point.details;
  if (!d) return [];

  if (point.type === 'ACE' || point.type === 'DOUBLE_FAULT' || point.type === 'FAULT_SECOND') {
    // formatAceOrDf só lê type, isSecondServe, rallyDetails.efeito/direcao e firstFault.
    const text = formatAceOrDf({
      type: point.type,
      isSecondServe: Boolean(d.isSecondServe),
      rallyDetails: { efeito: d.efeito, direcao: d.direcao },
      firstFault: d.firstFault ?? null,
    } as unknown as TimelinePoint);
    return text === '–' ? [] : [{ text, tone: point.type === 'ACE' ? 'green' : 'red' }];
  }

  const chips: DetailChip[] = [];
  const push = (text: string | undefined, tone: DetailTone = 'gray') => {
    if (text && text !== '–') chips.push({ text, tone });
  };

  if (d.situacao) push(situacaoLabel(d.situacao));
  if (d.tipo) push(tipoLabel(d.tipo), TIPO_TONE[d.tipo] ?? 'gray');
  if (d.golpe) push(golpeLabel(d.golpe));
  if (d.subtipo1) push(subtipo1Label(d.subtipo1));
  if (d.subtipo2) push(subtipo2Label(d.subtipo2));
  if (d.efeito) push(efeitoLabel(d.efeito));
  if (d.direcao) push(direcaoLabel(d.direcao));
  if (d.golpeEsp) push(golpeEspLabel(d.golpeEsp));
  if (d.duracao) push(duracaoLabel(d.duracao));
  return chips;
}
