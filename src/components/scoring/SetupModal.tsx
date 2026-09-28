'use client';

interface Player {
  id: string;
  name: string;
}

interface SetupModalProps {
  player1: Player;
  player2: Player;
  onSelectServer: (playerId: string) => void;
  loading?: boolean;
}

export function SetupModal({ player1, player2, onSelectServer, loading }: SetupModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative bg-telemetry-card border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 text-center">
        <h2 className="text-xl font-bold text-telemetry-text-primary mb-2">Quem saca primeiro?</h2>
        <p className="text-sm text-telemetry-text-muted mb-6">Selecione o jogador que fará o primeiro saque</p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onSelectServer(player1.id)}
            disabled={loading}
            className="w-full py-4 px-4 bg-telemetry-elevated hover:bg-telemetry-active hover:border-telemetry-volt hover:text-telemetry-volt border border-white/10 disabled:opacity-50 text-telemetry-text-primary font-bold rounded-xl text-lg transition-all active:scale-95"
          >
            {player1.name}
          </button>
          <button
            onClick={() => onSelectServer(player2.id)}
            disabled={loading}
            className="w-full py-4 px-4 bg-telemetry-elevated hover:bg-telemetry-active hover:border-telemetry-volt hover:text-telemetry-volt border border-white/10 disabled:opacity-50 text-telemetry-text-primary font-bold rounded-xl text-lg transition-all active:scale-95"
          >
            {player2.name}
          </button>
        </div>
        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-telemetry-text-muted">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-telemetry-volt" />
            <span className="text-sm">Iniciando partida...</span>
          </div>
        )}
      </div>
    </div>
  );
}
