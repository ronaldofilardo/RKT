import type { PointDetailsForm, Vencedor } from './point-details-logic';
import {
  getGolpeEspOptions,
  shouldShowDuracao,
  shouldShowEfeito,
  shouldShowSubtipo1,
} from './point-details-logic';

/**
 * Etapas da cascata do modal "Detalhes do ponto", na ORDEM em que são
 * renderizadas pelo SectionRenderer.
 */
export type StepKey =
  | 'situacao'
  | 'tipo'
  | 'golpe'
  | 'subtipo1'
  | 'efeito'
  | 'direcao'
  | 'golpeEsp'
  | 'duracao';

const STEP_ORDER: readonly StepKey[] = [
  'situacao',
  'tipo',
  'golpe',
  'subtipo1',
  'efeito',
  'direcao',
  'golpeEsp',
  'duracao',
];

/** Espelha as condições de renderização do SectionRenderer. */
export function isStepVisible(step: StepKey, form: PointDetailsForm, vencedor: Vencedor): boolean {
  const { situacao, tipo, golpe } = form;
  switch (step) {
    case 'situacao':
      return true;
    case 'tipo':
      return situacao != null;
    case 'golpe':
      return situacao != null && tipo != null;
    case 'subtipo1':
      return situacao != null && tipo != null && golpe != null && shouldShowSubtipo1(vencedor, situacao, tipo);
    case 'efeito':
      return (
        situacao != null &&
        tipo != null &&
        golpe != null &&
        shouldShowEfeito(vencedor, situacao, tipo, Boolean(form.subtipo1), Boolean(form.subtipo2))
      );
    case 'direcao':
      return golpe != null;
    case 'golpeEsp':
      return (
        golpe != null &&
        getGolpeEspOptions(
          golpe,
          form.efeito,
          vencedor,
          situacao ?? 'fundo',
          tipo ?? 'winner',
          form.subtipo2,
          form.direcao,
        ).length > 0
      );
    case 'duracao':
      return shouldShowDuracao(situacao, golpe, form.subtipo1);
    default:
      return false;
  }
}

/**
 * Dado o form anterior e o atual, devolve a PRÓXIMA etapa (visível e ainda
 * não preenchida) que o usuário precisa responder — ou null quando não há
 * nada a rolar (nenhuma resposta nova, ou cascata concluída).
 */
export function getNextStep(
  previous: PointDetailsForm,
  current: PointDetailsForm,
  vencedor: Vencedor,
): StepKey | null {
  let lastChangedIndex = -1;
  STEP_ORDER.forEach((step, index) => {
    if (current[step] != null && current[step] !== previous[step]) lastChangedIndex = index;
  });
  if (lastChangedIndex < 0) return null;

  for (let i = lastChangedIndex + 1; i < STEP_ORDER.length; i += 1) {
    const step = STEP_ORDER[i];
    if (isStepVisible(step, current, vencedor) && current[step] == null) return step;
  }
  return null;
}

const SCROLL_TOP_OFFSET_PX = 12;

interface Rect {
  top: number;
  bottom: number;
}

/**
 * Retorna o scrollTop desejado para trazer `target` ao topo do container,
 * ou null se o alvo já está totalmente visível (nada a rolar).
 */
export function computeScrollTop(
  containerRect: Rect,
  containerScrollTop: number,
  targetRect: Rect,
  offset: number = SCROLL_TOP_OFFSET_PX,
): number | null {
  const fullyVisible = targetRect.top >= containerRect.top && targetRect.bottom <= containerRect.bottom;
  if (fullyVisible) return null;
  const top = containerScrollTop + (targetRect.top - containerRect.top) - offset;
  return Math.max(0, top);
}
