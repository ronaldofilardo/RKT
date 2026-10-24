'use client';

import { useEffect, useRef } from 'react';

export interface SetSummaryModalState {
  isOpen: boolean;
  setNumber: number;
}

type ChromeState = {
  activeModal?: string | null;
  isLoading: boolean;
};

/**
 * Abre o modal de resumo do set automaticamente quando um novo set é
 * completado (fora do fluxo de edição de placar e fora da carga inicial).
 */
export function useSetSummaryAutoOpen(
  state: ChromeState,
  completedSetsCount: number,
  setSetSummaryModalState: React.Dispatch<React.SetStateAction<SetSummaryModalState>>,
  isOpen: boolean,
): void {
  const completedSetsCountRef = useRef<number>(completedSetsCount);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    const isEditScoreFlow =
      state.activeModal === 'edit-score' ||
      (typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('modal') === 'edit-score');

    if (isEditScoreFlow) {
      if (isOpen) {
        setSetSummaryModalState((prev) => ({ ...prev, isOpen: false }));
      }
      return;
    }

    if (state.isLoading) {
      return;
    }

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      completedSetsCountRef.current = completedSetsCount;
      return;
    }

    if (completedSetsCount > completedSetsCountRef.current && completedSetsCount > 0) {
      setSetSummaryModalState({ isOpen: true, setNumber: completedSetsCount });
    }
    completedSetsCountRef.current = completedSetsCount;
  }, [
    completedSetsCount,
    state.isLoading,
    state.activeModal,
    isOpen,
    setSetSummaryModalState,
  ]);
}
