'use client';

interface SelectPointWinnerModalProps {
  isOpen: boolean;
  winner: 'player1' | 'player2' | null;
  player1Name: string;
  player2Name: string;
  onSelectWinner: (winner: 'player1' | 'player2') => void;
  onBack: () => void;
}

export function SelectPointWinnerModal({
  isOpen,
  winner,
  player1Name,
  player2Name,
  onSelectWinner,
  onBack,
}: SelectPointWinnerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Selecionar vencedor do ponto"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-telemetry-card p-6 shadow-2xl"
      >
        <h2 className="mb-2 text-xl font-semibold tracking-tight">Quem venceu o ponto?</h2>
        <p className="mb-5 text-sm text-telemetry-text-muted">Selecione o jogador que conquistou o ponto</p>
        <div className="space-y-2 mb-4">
          <button
            type="button"
            onClick={() => onSelectWinner('player1')}
            className={`w-full rounded-xl border p-4 text-left transition-all ${
              winner === 'player1'
                ? 'border-telemetry-blue bg-telemetry-blue/20'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <span className="block font-medium">{player1Name}</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectWinner('player2')}
            className={`w-full rounded-xl border p-4 text-left transition-all ${
              winner === 'player2'
                ? 'border-telemetry-blue bg-telemetry-blue/20'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
            }`}
          >
            <span className="block font-medium">{player2Name}</span>
          </button>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm transition-colors hover:bg-white/10"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
