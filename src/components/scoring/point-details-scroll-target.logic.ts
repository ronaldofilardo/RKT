import type { PointDetailsForm, Vencedor } from './point-details-logic';
import { STEP_ORDER, isStepVisible, type StepKey } from './point-details-steps.logic';

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
