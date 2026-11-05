'use client';

import { BrandLogo } from '@/components/ui/brand-logo';
import { useAreaSelection } from './use-area-selection';

export default function EscolherAreaPage() {
  const { areas, loading, switching, selectArea } = useAreaSelection();

  if (loading) {
    return (
      <main className="min-h-screen bg-telemetry-base flex items-center justify-center p-4">
        <div className="text-telemetry-text-muted text-sm font-medium animate-pulse">Carregando seus perfis...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-telemetry-base text-telemetry-text-primary flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <BrandLogo size="md" priority />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Como você quer entrar?</h1>
          <p className="text-sm text-telemetry-text-muted">
            Você tem mais de um perfil ativo. Escolha com qual quer continuar:
          </p>
        </div>

        <div className="grid gap-3">
          {areas.map((opt) => {
            const key = `${opt.code}:${opt.ctId ?? 'default'}`;
            const isCurrentSwitching = switching === key;
            return (
              <button
                key={key}
                type="button"
                disabled={switching !== null}
                onClick={() => selectArea(opt.code, opt.ctId, opt.home)}
                className="w-full text-left p-4 rounded-xl border border-telemetry-border/20 bg-telemetry-card hover:border-telemetry-blue/50 hover:bg-telemetry-elevated transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
              >
                <div>
                  <div className="font-semibold text-base text-telemetry-text-primary">{opt.label}</div>
                  <div className="text-xs text-telemetry-text-muted mt-0.5">{opt.prefix}</div>
                </div>
                <div className="text-telemetry-blue font-bold text-sm">
                  {isCurrentSwitching ? 'Entrando...' : 'Entrar →'}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

