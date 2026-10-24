'use client';

import type { StepKey } from './use-point-details-scroll.logic';
import { computeScrollTop } from './use-point-details-scroll.logic';

type DivRef = React.RefObject<HTMLDivElement>;

export type ScrollRefs = {
  tipoRef: DivRef;
  golpeRef: DivRef;
  subtipo1Ref: DivRef;
  efeitoRef: DivRef;
  direcaoRef: DivRef;
  golpeEspRef: DivRef;
  duracaoRef: DivRef;
  containerRef: DivRef;
};

export function scrollStepIntoView(
  refs: ScrollRefs,
  nextStep: StepKey,
): void {
  const refByStep: Partial<Record<StepKey, DivRef>> = {
    tipo: refs.tipoRef,
    golpe: refs.golpeRef,
    subtipo1: refs.subtipo1Ref,
    efeito: refs.efeitoRef,
    direcao: refs.direcaoRef,
    golpeEsp: refs.golpeEspRef,
    duracao: refs.duracaoRef,
  };

  const container = refs.containerRef.current;
  const target = refByStep[nextStep]?.current;
  if (!container || !target) return;

  const top = computeScrollTop(
    container.getBoundingClientRect(),
    container.scrollTop,
    target.getBoundingClientRect(),
  );
  if (top == null) return;

  if (typeof container.scrollTo === 'function') {
    container.scrollTo({ top, behavior: 'smooth' });
  } else {
    container.scrollTop = top;
  }
}
