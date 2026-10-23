'use client';

import { useState } from 'react';
import type { DoublesArrangement } from '@/core/scoring/types';
import type { PlayerRef } from './doubles-arrangement-modal.types';

interface UseDoublesArrangementDeps {
  onConfirm: (arrangement: DoublesArrangement) => Promise<void> | void;
  onClose: () => void;
  player1: PlayerRef;
  player1Partner: PlayerRef;
  player2: PlayerRef;
  player2Partner: PlayerRef;
  currentArrangement?: DoublesArrangement | null;
}

export function useDoublesArrangement({
  onConfirm,
  onClose,
  player1,
  player1Partner,
  player2,
  player2Partner,
  currentArrangement,
}: UseDoublesArrangementDeps) {
  const [p1Server, setP1Server] = useState<string>(
    currentArrangement?.serveOrder.player1[0] ?? player1.id
  );
  const [p2Server, setP2Server] = useState<string>(
    currentArrangement?.serveOrder.player2[0] ?? player2.id
  );
  const [p1Receiver, setP1Receiver] = useState<string>(
    currentArrangement?.receiveDeuce.player1 ?? player1.id
  );
  const [p2Receiver, setP2Receiver] = useState<string>(
    currentArrangement?.receiveDeuce.player2 ?? player2.id
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const p1Second = p1Server === player1.id ? player1Partner.id : player1.id;
      const p2Second = p2Server === player2.id ? player2Partner.id : player2.id;

      const newArrangement: DoublesArrangement = {
        serveOrder: {
          player1: [p1Server, p1Second],
          player2: [p2Server, p2Second],
        },
        serveIndex: { player1: 0, player2: 0 },
        receiveDeuce: {
          player1: p1Receiver,
          player2: p2Receiver,
        },
      };

      await onConfirm(newArrangement);
      onClose();
    } catch (err) {
      console.error('[DoublesArrangementModal] Erro ao confirmar formação:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    p1Server, setP1Server, p2Server, setP2Server,
    p1Receiver, setP1Receiver, p2Receiver, setP2Receiver,
    isSubmitting, handleConfirm,
  };
}
