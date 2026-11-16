'use client';

interface GuardianUpgradeBannerProps {
  upgrading: boolean;
  onUpgrade: () => void;
}

export function GuardianUpgradeBanner({ upgrading, onUpgrade }: GuardianUpgradeBannerProps) {
  return (
    <div className="bg-gradient-to-r from-telemetry-elevated/80 to-telemetry-blue/10 border border-telemetry-blue/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-base">🛡️</span>
          <span className="text-xs font-bold uppercase tracking-wider text-telemetry-blue">
            Modo Básico de Acompanhamento Ativo
          </span>
        </div>
        <p className="text-xs text-telemetry-text-muted leading-relaxed max-w-xl">
          Você tem acesso à supervisão de agenda e treinadores. Deseja acompanhar a <strong>transmissão ao vivo</strong>, visualizar <strong>placares ponto a ponto</strong> e também <strong>criar e anotar partidas</strong>?
        </p>
      </div>

      <button
        type="button"
        disabled={upgrading}
        onClick={onUpgrade}
        className="shrink-0 bg-telemetry-blue hover:bg-telemetry-blue/90 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
      >
        <span>⚡</span>
        {upgrading ? 'Realizando Upgrade...' : 'Fazer Upgrade para Espectador & Anotador'}
      </button>
    </div>
  );
}
