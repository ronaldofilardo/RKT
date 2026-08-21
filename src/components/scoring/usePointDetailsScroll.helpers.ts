import type { PointDetailsForm } from './point-details-logic';
import { shouldShowDuracao } from './point-details-logic';

interface ScrollRefs {
  tipoRef: React.RefObject<HTMLDivElement>;
  subtipo1Ref: React.RefObject<HTMLDivElement>;
  subtipo2Ref: React.RefObject<HTMLDivElement>;
  duracaoRef: React.RefObject<HTMLDivElement>;
  efeitoRef: React.RefObject<HTMLDivElement>;
}

interface ScrollNeeds {
  needsEfeito: boolean;
  needsSubtipo1: boolean;
  needsSubtipo2: boolean;
}

function getTypeTarget(current: PointDetailsForm, previous: PointDetailsForm, refs: ScrollRefs) {
  return current.tipo && !previous.tipo ? refs.tipoRef.current : null;
}

function getGolpeTarget(needs: ScrollNeeds, refs: ScrollRefs) {
  if (needs.needsSubtipo1 && refs.subtipo1Ref.current) return refs.subtipo1Ref.current;
  if (needs.needsSubtipo2 && refs.subtipo2Ref.current) return refs.subtipo2Ref.current;
  if (needs.needsEfeito && refs.efeitoRef.current) return refs.efeitoRef.current;
  return null;
}

function getAfterEfeitoTarget(current: PointDetailsForm, previous: PointDetailsForm, refs: ScrollRefs) {
  if (!current.efeito || previous.efeito) return null;
  if (!shouldShowDuracao(current.situacao, current.golpe)) return null;
  return refs.duracaoRef.current;
}

function getSubtypeTarget(current: PointDetailsForm, previous: PointDetailsForm, refs: ScrollRefs) {
  if (current.subtipo1 && !previous.subtipo1) return refs.subtipo1Ref.current;
  if (current.subtipo2 && !previous.subtipo2) return refs.subtipo2Ref.current;
  return null;
}

function getEffectTarget(current: PointDetailsForm, previous: PointDetailsForm, refs: ScrollRefs) {
  return current.efeito && !previous.efeito ? refs.efeitoRef.current : null;
}

function getAfterGolpeTarget(current: PointDetailsForm, previous: PointDetailsForm, needs: ScrollNeeds, refs: ScrollRefs) {
  return current.golpe && !previous.golpe ? getGolpeTarget(needs, refs) : null;
}

export function getScrollTarget(current: PointDetailsForm, previous: PointDetailsForm, needs: ScrollNeeds, refs: ScrollRefs) {
  const candidates = [
    getTypeTarget(current, previous, refs),
    getAfterGolpeTarget(current, previous, needs, refs),
    getAfterEfeitoTarget(current, previous, refs),
    getSubtypeTarget(current, previous, refs),
    getEffectTarget(current, previous, refs),
  ];
  return candidates.find(Boolean) ?? null;
}
