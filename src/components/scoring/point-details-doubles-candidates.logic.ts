'use client';

import { useEffect, useMemo } from 'react';
import type { PointDetailsForm, Action } from './point-details.types';
import type { PointDetailsDoublesInfo } from './use-point-details-modal.types';

type DispatchLike = React.Dispatch<Action>;
type Candidate = { id: string; name: string };

export function useHitterCandidates(
  doubles: PointDetailsDoublesInfo | undefined,
  form: PointDetailsForm,
  winnerPlayerSide: 'player1' | 'player2',
): Candidate[] {
  return useMemo(() => {
    if (!doubles || !form.tipo) return [];
    const targetSide = form.tipo === 'winner'
      ? winnerPlayerSide
      : (winnerPlayerSide === 'player1' ? 'player2' : 'player1');

    const members = targetSide === 'player1'
      ? [doubles.player1, doubles.player1Partner]
      : [doubles.player2, doubles.player2Partner];

    return members.filter((m): m is Candidate => Boolean(m));
  }, [doubles, form.tipo, winnerPlayerSide]);
}

export function useReceiverCandidates(
  doubles: PointDetailsDoublesInfo | undefined,
  currentServer: 'player1' | 'player2',
): Candidate[] {
  return useMemo(() => {
    if (!doubles?.isDecidingPoint) return [];
    const receiverSide = currentServer === 'player1' ? 'player2' : 'player1';
    const members = receiverSide === 'player1'
      ? [doubles.player1, doubles.player1Partner]
      : [doubles.player2, doubles.player2Partner];

    return members.filter((m): m is Candidate => Boolean(m));
  }, [doubles, currentServer]);
}

export function useDoublesReceiverDefault(
  doubles: PointDetailsDoublesInfo | undefined,
  form: PointDetailsForm,
  dispatch: DispatchLike,
): void {
  useEffect(() => {
    if (doubles?.isDecidingPoint && doubles.activeReceiverId && !form.receiverId) {
      dispatch({ type: 'SET_RECEIVER', value: doubles.activeReceiverId });
    }
  }, [doubles?.isDecidingPoint, doubles?.activeReceiverId, form.receiverId]);
}

export function useDoublesHitterDefault(
  doubles: PointDetailsDoublesInfo | undefined,
  form: PointDetailsForm,
  hitterCandidates: Candidate[],
  dispatch: DispatchLike,
): void {
  useEffect(() => {
    if (hitterCandidates.length > 0 && !form.hitterId) {
      if (form.situacao === 'devolucao' && doubles?.activeReceiverId && hitterCandidates.some(c => c.id === doubles.activeReceiverId)) {
        dispatch({ type: 'SET_HITTER', value: doubles.activeReceiverId });
      } else if (form.situacao === 'saque' && doubles?.activeServerId && hitterCandidates.some(c => c.id === doubles.activeServerId)) {
        dispatch({ type: 'SET_HITTER', value: doubles.activeServerId });
      }
    }
  }, [hitterCandidates, form.hitterId, form.situacao, doubles?.activeReceiverId, doubles?.activeServerId]);
}
