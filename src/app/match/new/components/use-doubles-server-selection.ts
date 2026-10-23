'use client';

import { useState } from 'react';
import type { DoublesSetup } from '@/schemas/contracts';
import type { SelectablePlayer } from './ServerSelectionModal';

interface DoublesSelectionPlayers {
  selectedP1: SelectablePlayer | null;
  selectedP1Partner: SelectablePlayer | null;
  selectedP2: SelectablePlayer | null;
  selectedP2Partner: SelectablePlayer | null;
}

export function useDoublesServerSelection({
  selectedP1,
  selectedP1Partner,
  selectedP2,
  selectedP2Partner,
}: DoublesSelectionPlayers) {
  const p1Id = selectedP1?.id || '';
  const p1PartnerId = selectedP1Partner?.id || '';
  const p2Id = selectedP2?.id || '';
  const p2PartnerId = selectedP2Partner?.id || '';

  // Step 1: Qual dupla começa sacando? ('player1' ou 'player2')
  const [servingSide, setServingSide] = useState<'player1' | 'player2'>('player1');
  // Step 2: Quem saca primeiro na Dupla 1?
  const [firstServerP1, setFirstServerP1] = useState<string>('');
  // Step 2: Quem saca primeiro na Dupla 2?
  const [firstServerP2, setFirstServerP2] = useState<string>('');
  // Step 3: Quem recebe no Deuce na Dupla 1?
  const [receiveDeuceP1, setReceiveDeuceP1] = useState<string>('');
  // Step 3: Quem recebe no Deuce na Dupla 2?
  const [receiveDeuceP2, setReceiveDeuceP2] = useState<string>('');

  // Inicializadores automáticos se vazios
  const activeFirstServerP1 = firstServerP1 || p1Id;
  const activeFirstServerP2 = firstServerP2 || p2Id;
  const activeReceiveDeuceP1 = receiveDeuceP1 || p1Id;
  const activeReceiveDeuceP2 = receiveDeuceP2 || p2Id;

  const secondServerP1 = activeFirstServerP1 === p1Id ? p1PartnerId : p1Id;
  const secondServerP2 = activeFirstServerP2 === p2Id ? p2PartnerId : p2Id;

  const buildConfirmation = (): {
    initialServerId: string;
    setup: DoublesSetup;
  } => {
    const initialServerId =
      servingSide === 'player1' ? activeFirstServerP1 : activeFirstServerP2;
    const setup: DoublesSetup = {
      serveOrder: {
        player1: [activeFirstServerP1, secondServerP1],
        player2: [activeFirstServerP2, secondServerP2],
      },
      receiveDeuce: {
        player1: activeReceiveDeuceP1,
        player2: activeReceiveDeuceP2,
      },
      changes: [],
    };
    return { initialServerId, setup };
  };

  return {
    servingSide,
    setServingSide,
    activeFirstServerP1,
    activeFirstServerP2,
    activeReceiveDeuceP1,
    activeReceiveDeuceP2,
    setFirstServerP1,
    setFirstServerP2,
    setReceiveDeuceP1,
    setReceiveDeuceP2,
    buildConfirmation,
  };
}
