'use client';

import { useEffect, useRef } from 'react';
import type { PointDetailsForm } from './point-details-logic';
import {
  computeScrollTop,
  getNextStep,
  type StepKey,
} from './usePointDetailsScroll.helpers';

type Vencedor = 'sacador' | 'devolvedor';
type DivRef = React.RefObject<HTMLDivElement>;

interface UsePointDetailsScrollProps {
  form: PointDetailsForm;
  vencedor: Vencedor;
  mounted: boolean;
  /** Elemento com overflow-y (data-testid="modal-content"). */
  containerRef: DivRef;
  tipoRef: DivRef;
  golpeRef: DivRef;
  duracaoRef: DivRef;
  subtipo1Ref: DivRef;
  efeitoRef: DivRef;
  direcaoRef: DivRef;
  golpeEspRef: DivRef;
}

/**
 * Rola automaticamente o modal para a próxima etapa da cascata assim que o
 * usuário responde a etapa atual — em telas pequenas a próxima seção nasce
 * abaixo da dobra e o usuário não precisa arrastar a tela manualmente.
 */
export function usePointDetailsScroll({
  form,
  vencedor,
  mounted,
  containerRef,
  tipoRef,
  golpeRef,
  duracaoRef,
  subtipo1Ref,
  efeitoRef,
  direcaoRef,
  golpeEspRef,
}: UsePointDetailsScrollProps) {
  const prevFormRef = useRef<PointDetailsForm>(form);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mounted) return;

    const previous = prevFormRef.current;
    prevFormRef.current = form;

    const nextStep = getNextStep(previous, form, vencedor);
    if (!nextStep) return;

    const refByStep: Partial<Record<StepKey, DivRef>> = {
      tipo: tipoRef,
      golpe: golpeRef,
      subtipo1: subtipo1Ref,
      efeito: efeitoRef,
      direcao: direcaoRef,
      golpeEsp: golpeEspRef,
      duracao: duracaoRef,
    };

    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);

    // rAF: espera o commit/layout da seção recém-renderizada antes de medir.
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const container = containerRef.current;
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
    });
  }, [
    form,
    vencedor,
    mounted,
    containerRef,
    tipoRef,
    golpeRef,
    subtipo1Ref,
    efeitoRef,
    direcaoRef,
    golpeEspRef,
    duracaoRef,
  ]);

  useEffect(
    () => () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );
}
