import { useEffect, useRef } from 'react';
import type { PointDetailsForm } from './point-details-logic';
import { shouldShowSubtipo1, shouldShowSubtipo2, shouldShowEfeito } from './point-details-logic';
import { getScrollTarget } from './usePointDetailsScroll.helpers';

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

export function usePointDetailsScroll({ form, vencedor, mounted, containerRef, tipoRef, golpeRef, duracaoRef, subtipo1Ref, subtipo2Ref, efeitoRef }: UsePointDetailsScrollProps) {
  const prevFormRef = useRef<PointDetailsForm>(form);
  const needsRef = useRef({ needsEfeito: false, needsSubtipo1: false, needsSubtipo2: false });
  const needsEfeito = Boolean(form.golpe && form.situacao && form.tipo && shouldShowEfeito(vencedor, form.situacao, form.tipo, Boolean(form.subtipo1), Boolean(form.subtipo2)));
  const needsSubtipo1 = Boolean(form.situacao && form.tipo && shouldShowSubtipo1(vencedor, form.situacao, form.tipo));
  const needsSubtipo2 = Boolean(form.situacao && form.tipo && form.golpe && shouldShowSubtipo2(form.situacao, form.tipo, form.golpe));
  needsRef.current = { needsEfeito, needsSubtipo1, needsSubtipo2 };

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    const current = form;
    const previous = prevFormRef.current;
    const target = getScrollTarget(current, previous, needsRef.current, { tipoRef, subtipo1Ref, subtipo2Ref, duracaoRef, efeitoRef });
    if (target) scheduleScroll(target, Boolean(current.golpe && !previous.golpe));
    prevFormRef.current = current;
  }, [form.tipo, form.golpe, form.duracao, form.subtipo1, form.subtipo2, form.efeito, mounted, containerRef, tipoRef, golpeRef, duracaoRef, subtipo1Ref, subtipo2Ref, efeitoRef, vencedor, form.situacao]);
}

function scheduleScroll(target: HTMLDivElement, useStart: boolean) {
  setTimeout(() => {
    if (typeof target.scrollIntoView !== 'function') return;
    target.scrollIntoView({ behavior: 'smooth', block: useStart ? 'start' : 'center', inline: 'nearest' });
  }, 50);
}
