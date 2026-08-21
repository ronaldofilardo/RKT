'use client';

import { useState } from 'react';
import { MatchFinishReason } from '@/schemas/contracts';
import { FinishMatchModalView } from './FinishMatchModal.view';

interface FinishMatchModalProps {
  matchId: string;
  matchState: string;
  matchNickname?: string;
  player1Name: string;
  player2Name: string;
  onConfirm: (reason: MatchFinishReason, note?: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const REASON_LABELS: Record<MatchFinishReason, string> = {
  COMPLETED: 'Partida completada normalmente',
  ABANDONED: 'Abandono durante a partida',
  WALKOVER: 'Walkover (adversário não compareceu)',
  INJURY: 'Lesão de jogador',
  OUTRO: 'Outro motivo',
};

export function FinishMatchModal({
  matchNickname,
  player1Name,
  player2Name,
  onConfirm,
  onCancel,
  loading,
}: FinishMatchModalProps) {
  const [reason, setReason] = useState<MatchFinishReason>('COMPLETED');
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState('');

  const handleConfirm = async () => {
    await onConfirm(reason, showNote ? note || undefined : undefined);
  };

  const matchLabel = matchNickname || `${player1Name} vs ${player2Name}`;

  return <FinishMatchModalView matchLabel={matchLabel} reason={reason} showNote={showNote} note={note} loading={loading} labels={REASON_LABELS} onReason={setReason} onToggleNote={() => setShowNote(!showNote)} onNote={setNote} onConfirm={handleConfirm} onCancel={onCancel} />;
}
