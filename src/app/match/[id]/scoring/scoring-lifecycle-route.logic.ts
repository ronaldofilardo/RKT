'use client';

import { useEffect, useRef } from 'react';
import type { ScoringPageState } from './useScoringPageState';

/**
 * Redireciona cartaz para anotação própria, e partida já finalizada para /report
 * (exceto ?modal=edit-score). Também abre o setup quando não há sacador inicial.
 */
export function useInitialStateRouteEffect(state: ScoringPageState) {
  const { open } = state;
  const initialStateCheckedRef = useRef(false);

  useEffect(() => {
    if (initialStateCheckedRef.current || !state.match) return;
    initialStateCheckedRef.current = true;

    const m = state.match as { id: string; state: string; isTemplate?: boolean; isPublicTemplate?: boolean };
    if (m.isTemplate || m.isPublicTemplate) {
      fetch(`/api/matches/${m.id}/annotate`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: 'resolve' }),
      })
        .then((r) => r.json())
        .then((json: { matchId?: string }) => {
          if (json.matchId) state.router.replace(`/match/${json.matchId}/scoring`);
        })
        .catch(() => undefined);
      return;
    }

    const isEditScoreModal =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("modal") === "edit-score";

    if (state.match.state === "FINISHED" && !isEditScoreModal) {
      state.router.replace(`/match/${state.match.id}/report`);
      return;
    }

    // Se a partida não possui sacador inicial definido ou está agendada (SCHEDULED),
    // abre obrigatoriamente o modal de escolha de sacador / formação inicial de duplas
    if (!state.match.initialServerId || state.match.state === "SCHEDULED") {
      open("setup");
    }
  }, [state.match, state.router, open]);
}
