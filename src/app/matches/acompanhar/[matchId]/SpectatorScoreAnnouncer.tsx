'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { SpectatorScore } from '@/core/spectate';

interface Props {
  score: SpectatorScore;
  side1Label: string;
  side2Label: string;
}

export function SpectatorScoreAnnouncer({ score, side1Label, side2Label }: Props) {
  const [announcement, setAnnouncement] = useState('');
  const prevRef = useRef<{ setsCount: number; lastSetGames: string }>({
    setsCount: score.sets.length,
    lastSetGames: score.sets.length > 0 ? `${score.sets[score.sets.length - 1].player1}-${score.sets[score.sets.length - 1].player2}` : '0-0',
  });

  useEffect(() => {
    const currentSetsCount = score.sets.length;
    const currentLastSet = score.sets[currentSetsCount - 1];
    const currentGames = currentLastSet ? `${currentLastSet.player1}-${currentLastSet.player2}` : '0-0';

    const prev = prevRef.current;
    if (currentSetsCount > prev.setsCount) {
      setAnnouncement(`Fim de set. Placar de sets: ${score.sets.map((s) => `${s.player1} a ${s.player2}`).join(', ')}.`);
    } else if (currentGames !== prev.lastSetGames) {
      setAnnouncement(`Game encerrado. Placar atual: ${side1Label} ${currentLastSet?.player1 ?? 0}, ${side2Label} ${currentLastSet?.player2 ?? 0}.`);
    }

    prevRef.current = { setsCount: currentSetsCount, lastSetGames: currentGames };
  }, [score, side1Label, side2Label]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {announcement}
    </div>
  );
}

