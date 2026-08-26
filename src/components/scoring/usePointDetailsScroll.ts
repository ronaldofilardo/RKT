'use client';

import { useEffect, useRef } from 'react';
import type { PointDetailsForm } from './point-details-logic';
import {
  shouldShowSubtipo1,
  shouldShowSubtipo2,
  shouldShowEfeito,
  shouldShowDuracao,
} from './point-details-logic';

type Vencedor = 'sacador' | 'devolvedor';

interface UsePointDetailsScrollProps {
  form: PointDetailsForm;
  vencedor: Vencedor;
  mounted: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  tipoRef: React.RefObject<HTMLDivElement>;
  golpeRef: React.RefObject<HTMLDivElement>;
  duracaoRef: React.RefObject<HTMLDivElement>;
  subtipo1Ref: React.RefObject<HTMLDivElement>;
  subtipo2Ref: React.RefObject<HTMLDivElement>;
  efeitoRef: React.RefObject<HTMLDivElement>;
}

export function usePointDetailsScroll({
  form,
  vencedor,
  mounted,
  containerRef,
  tipoRef,
  golpeRef,
  duracaoRef,
  subtipo1Ref,
  subtipo2Ref,
  efeitoRef,
}: UsePointDetailsScrollProps) {
  const prevFormRef = useRef<PointDetailsForm>(form);
  const needsRef = useRef({
    needsEfeito: false,
    needsSubtipo1: false,
    needsSubtipo2: false,
  });

  const needsEfeito = form.golpe != null && form.situacao && form.tipo && shouldShowEfeito(vencedor, form.situacao, form.tipo, !!form.subtipo1, !!form.subtipo2);
  const needsSubtipo1 = form.situacao && form.tipo && shouldShowSubtipo1(vencedor, form.situacao, form.tipo);
  const needsSubtipo2 = form.situacao && form.tipo && form.golpe && shouldShowSubtipo2(form.situacao, form.tipo, form.golpe);

  needsRef.current = { needsEfeito: !!needsEfeito, needsSubtipo1: !!needsSubtipo1, needsSubtipo2: !!needsSubtipo2 };

  useEffect(() => {
    if (!mounted) return;
    
    const container = containerRef.current;
    if (!container) return;

    const currentForm = form;
    const prev = prevFormRef.current;
    const { needsEfeito: currNeedsEfeito, needsSubtipo1: currNeedsSubtipo1, needsSubtipo2: currNeedsSubtipo2 } = needsRef.current;

    const getTargetRef = () => {
      if (currentForm.tipo && !prev.tipo && tipoRef.current) return tipoRef.current;
      if (currentForm.golpe && !prev.golpe) {
        if (currNeedsSubtipo1 && subtipo1Ref.current) return subtipo1Ref.current;
        if (currNeedsSubtipo2 && subtipo2Ref.current) return subtipo2Ref.current;
        if (currNeedsEfeito && efeitoRef.current) return efeitoRef.current;
      }
      if (currentForm.efeito && !prev.efeito) {
        if (shouldShowDuracao(currentForm.situacao, currentForm.golpe) && duracaoRef.current) return duracaoRef.current;
      }
      if (currentForm.subtipo1 && !prev.subtipo1 && subtipo1Ref.current) return subtipo1Ref.current;
      if (currentForm.subtipo2 && !prev.subtipo2 && subtipo2Ref.current) return subtipo2Ref.current;
      if (currentForm.efeito && !prev.efeito && efeitoRef.current) return efeitoRef.current;
      
      return null;
    };

    const targetRef = getTargetRef();
    if (targetRef) {
      const useStart = (currentForm.golpe && !prev.golpe);
      setTimeout(() => {
        if (typeof targetRef.scrollIntoView === 'function') {
          targetRef.scrollIntoView({ 
            behavior: 'smooth', 
            block: useStart ? 'start' : 'center',
            inline: 'nearest'
          });
        }
      }, 50);
    }
    
    prevFormRef.current = currentForm;
  }, [
    form,
    mounted,
    containerRef,
    tipoRef,
    golpeRef,
    duracaoRef,
    subtipo1Ref,
    subtipo2Ref,
    efeitoRef,
    vencedor,
    form.situacao,
  ]);
}