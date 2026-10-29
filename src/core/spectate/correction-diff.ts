import type { SpectatorView, SpectatorCorrectionAlert } from './types';

export interface DiffFeedResult {
  removedPointIds: string[];
  newPointIds: string[];
  hasScoreEdit: boolean;
  hasArrangementChange: boolean;
  alert: SpectatorCorrectionAlert | null;
}

/**
 * Compara snapshots sucessivos de SpectatorView para emitir alertas de correção transparentes.
 * Primeira carga (prev == null) jamais gera alertas.
 */
export function diffFeedViews(prev: SpectatorView | null, next: SpectatorView): DiffFeedResult {
  if (!prev) {
    return {
      removedPointIds: [],
      newPointIds: next.points.map((p) => p.id),
      hasScoreEdit: false,
      hasArrangementChange: false,
      alert: null,
    };
  }

  const prevIds = new Set(prev.points.map((p) => p.id));
  const nextIds = new Set(next.points.map((p) => p.id));

  const removedPointIds = prev.points.filter((p) => !nextIds.has(p.id)).map((p) => p.id);
  const newPointIds = next.points.filter((p) => !prevIds.has(p.id)).map((p) => p.id);

  const prevMarkers = new Set(prev.markers.map((m) => `${m.kind}:${m.at}`));
  const newMarkers = next.markers.filter((m) => !prevMarkers.has(`${m.kind}:${m.at}`));

  const hasScoreEdit = newMarkers.some((m) => m.kind === 'SCORE_EDIT');
  const hasArrangementChange = newMarkers.some((m) => m.kind === 'ARRANGEMENT_CHANGE');

  let alert: SpectatorCorrectionAlert | null = null;

  if (removedPointIds.length > 0 && !hasScoreEdit) {
    const count = removedPointIds.length;
    alert = {
      kind: 'POINT_VOIDED',
      message: count === 1
        ? 'Correção do anotador: o último ponto foi desfeito'
        : `Correção do anotador: ${count} pontos foram desfeitos`,
    };
  } else if (hasScoreEdit) {
    const edit = [...newMarkers].reverse().find((m) => m.kind === 'SCORE_EDIT');
    alert = {
      kind: 'SCORE_EDIT',
      message: 'Placar ajustado manualmente pelo anotador',
      ...(edit?.from && edit?.to ? { from: edit.from, to: edit.to } : {}),
    };
  } else if (hasArrangementChange) {
    alert = {
      kind: 'ARRANGEMENT_CHANGE',
      message: 'Ordem de saque/devolução atualizada',
    };
  }

  return {
    removedPointIds,
    newPointIds,
    hasScoreEdit,
    hasArrangementChange,
    alert,
  };
}

