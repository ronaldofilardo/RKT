'use client';

import type { SessionContextOption } from '@/lib/auth-client-login';

interface ContextSwitcherMenuProps {
  availableContexts: SessionContextOption[];
  activeContextId?: string | null;
  isCoach: boolean;
  hasParticular: boolean;
  onSwitch: (id: string) => void;
  onActivateParticular: () => void;
}

export function ContextSwitcherMenu({
  availableContexts,
  activeContextId,
  isCoach,
  hasParticular,
  onSwitch,
  onActivateParticular,
}: ContextSwitcherMenuProps) {
  return (
    <div
      role="menu"
      className="absolute right-0 mt-2 w-64 rounded-xl shadow-2xl bg-telemetry-card border border-telemetry-border/20 py-1.5 z-50 text-xs"
    >
      <div className="px-3 py-1.5 text-telemetry-text-muted font-semibold uppercase tracking-wider text-[10px] border-b border-telemetry-border/10">
        Alternar contexto
      </div>
      {availableContexts.map((ctx) => {
        const isSelected = ctx.id === activeContextId;
        return (
          <button
            key={ctx.id}
            role="menuitem"
            type="button"
            onClick={() => onSwitch(ctx.id)}
            className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-telemetry-blue/10 transition-colors cursor-pointer ${
              isSelected ? 'font-semibold text-telemetry-blue' : 'text-telemetry-text-primary'
            }`}
          >
            <div>
              <p className="truncate">{ctx.label}</p>
              <span className="text-[10px] text-telemetry-text-muted">
                {ctx.type === 'PARTICULAR' ? 'Avulso' : ctx.role}
              </span>
            </div>
            {isSelected && <span className="text-telemetry-blue">✓</span>}
          </button>
        );
      })}
      {isCoach && !hasParticular && (
        <div className="pt-1 mt-1 border-t border-telemetry-border/10">
          <button
            type="button"
            onClick={onActivateParticular}
            className="w-full text-left px-3 py-2 flex items-center gap-2 text-telemetry-blue hover:bg-telemetry-blue/10 transition-colors cursor-pointer"
          >
            <span className="text-sm font-bold">+</span>
            <span>Ativar atendimento Particular</span>
          </button>
        </div>
      )}
    </div>
  );
}

