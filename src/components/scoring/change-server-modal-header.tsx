import type { MatchData } from '@/hooks/useScoringHandlers.types';

export interface ChangeServerModalHeaderProps {
  isDoubles: boolean;
  match: MatchData;
  activeServerId?: string | null;
}

export function ChangeServerModalHeader({ isDoubles, match, activeServerId }: ChangeServerModalHeaderProps) {
  if (!isDoubles) {
    const rawServerSide =
      match.scoreState && typeof match.scoreState === 'object' && 'server' in match.scoreState
        ? (match.scoreState as { server?: string }).server
        : undefined;
    const player1 = match.player1;
    const player2 = match.player2;
    const currentServerId = activeServerId ?? (rawServerSide === 'player2' ? player2.id : player1.id);
    const currentServer = currentServerId === player1.id ? player1 : player2;

    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-telemetry-volt/20 text-telemetry-volt flex items-center justify-center mx-auto text-2xl">
          🎾
        </div>
        <div>
          <h3 className="text-lg font-bold text-telemetry-text-primary">
            Inverter sacador inicial
          </h3>
          <p className="text-xs text-telemetry-text-muted mt-2 leading-relaxed">
            O primeiro saque está com <span className="text-telemetry-text-primary font-semibold">{currentServer.name}</span>. Deseja passar o saque inicial para{' '}
            <span className="text-telemetry-text-primary font-semibold">
              {currentServerId === player1.id ? player2.name : player1.name}
            </span>
            ?
          </p>
        </div>
        <div className="p-3 rounded-xl bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert text-left">
          <p className="text-xs font-semibold flex items-center gap-1.5 mb-1">
            <span>⚠️</span>
            <span>Atenção: ação única</span>
          </p>
          <p className="text-[11px] leading-relaxed text-telemetry-alert/90">
            A troca só pode ser realizada antes do primeiro ponto. Ao confirmar, o novo sacador será definido e não será mais possível alterar o sacador ao longo de toda a partida.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">🎾</span>
      <div>
        <h3 className="text-base font-bold text-telemetry-text-primary">
          Corrigir Sacador do Game
        </h3>
        <p className="text-xs text-telemetry-text-muted">
          Selecione o atleta que está sacando no game atual:
        </p>
      </div>
    </div>
  );
}