'use client';

import { useRef } from 'react';
import type { PointDetailsForm, Vencedor } from './point-details-logic';
import { usePointDetailsScroll } from './usePointDetailsScroll';

export interface PointDetailsSectionRefs {
  containerRef: React.RefObject<HTMLDivElement>;
  tipoRef: React.RefObject<HTMLDivElement>;
  golpeRef: React.RefObject<HTMLDivElement>;
  duracaoRef: React.RefObject<HTMLDivElement>;
  subtipo1Ref: React.RefObject<HTMLDivElement>;
  efeitoRef: React.RefObject<HTMLDivElement>;
  direcaoRef: React.RefObject<HTMLDivElement>;
  golpeEspRef: React.RefObject<HTMLDivElement>;
}

export function usePointDetailsSectionRefs(
  form: PointDetailsForm,
  vencedor: Vencedor,
  mounted: boolean
): PointDetailsSectionRefs {
  const tipoRef = useRef<HTMLDivElement>(null);
  const golpeRef = useRef<HTMLDivElement>(null);
  const duracaoRef = useRef<HTMLDivElement>(null);
  const subtipo1Ref = useRef<HTMLDivElement>(null);
  const efeitoRef = useRef<HTMLDivElement>(null);
  const direcaoRef = useRef<HTMLDivElement>(null);
  const golpeEspRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  usePointDetailsScroll({
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
  });

  return { containerRef, tipoRef, golpeRef, duracaoRef, subtipo1Ref, efeitoRef, direcaoRef, golpeEspRef };
}
