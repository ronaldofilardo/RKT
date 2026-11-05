'use client';

import type { SessionContextOption } from '@/lib/auth-client-login';

interface LoginContextSelectorProps {
  contexts: SessionContextOption[];
  isLoading: boolean;
  onSelect: (contextId: string) => void;
  onCancel: () => void;
}

export function LoginContextSelector({
  contexts,
  isLoading,
  onSelect,
  onCancel,
}: LoginContextSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-telemetry-text-primary text-center">
        Com qual perfil você quer entrar?
      </h2>
      <p className="text-xs text-telemetry-text-muted text-center mb-2">
        Você tem mais de um vínculo ativo. Escolha como quer entrar agora:
      </p>

      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
        {contexts.map((ctx) => (
          <button
            key={ctx.id}
            type="button"
            disabled={isLoading}
            onClick={() => onSelect(ctx.id)}
            className="flex items-center justify-between p-3 rounded-xl border border-telemetry-border/20 bg-telemetry-elevated/40 hover:bg-telemetry-blue/10 hover:border-telemetry-blue/50 text-left transition-all cursor-pointer group"
          >
            <div>
              <p className="text-sm font-medium text-telemetry-text-primary group-hover:text-telemetry-blue">
                {ctx.label}
              </p>
              <span className="text-xs text-telemetry-text-muted">
                {ctx.type === 'PARTICULAR' ? 'Atendimento avulso' : `${ctx.role} em ${ctx.label}`}
              </span>
            </div>
            <span className="text-telemetry-text-muted group-hover:text-telemetry-blue text-lg">
              →
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={isLoading}
        onClick={onCancel}
        className="mt-2 text-xs text-telemetry-text-muted hover:text-telemetry-text-primary text-center underline cursor-pointer"
      >
        ← Voltar
      </button>
    </div>
  );
}

