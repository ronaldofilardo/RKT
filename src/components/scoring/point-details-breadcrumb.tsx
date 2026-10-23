'use client';

import type { PointDetailsForm, Vencedor } from './point-details-logic';
import { buildBreadcrumbItems } from './point-details-breadcrumb-items.logic';

export type { BreadcrumbStep } from './point-details-breadcrumb-items.logic';

interface PointDetailsBreadcrumbProps { form: PointDetailsForm; vencedor: Vencedor; onNavigateStep?: (step: import('./point-details-breadcrumb-items.logic').BreadcrumbStep) => void; }

export function PointDetailsBreadcrumb({
  form,
  onNavigateStep,
}: PointDetailsBreadcrumbProps) {
  const items = buildBreadcrumbItems(form);

  if (items.length === 0) {
    return (
      <div className="bg-white/[0.02] border-b border-white/10 px-4 py-1.5 text-[11px] text-telemetry-text-muted flex items-center gap-1.5 select-none">
        <span className="text-telemetry-volt font-bold">1</span>
        <span>Selecione a situação inicial do ponto</span>
      </div>
    );
  }

  return (
    <nav
      aria-label="Trilha de detalhes do ponto"
      className="bg-white/[0.02] border-b border-white/10 px-4 py-1.5 flex items-center gap-1 overflow-x-auto text-[11px] scrollbar-none select-none"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={item.key} className="flex items-center gap-1 flex-shrink-0">
            {index > 0 && <span className="text-telemetry-text-muted/50 text-[10px]">›</span>}
            <button
              type="button"
              onClick={() => onNavigateStep?.(item.key)}
              className={`px-2 py-0.5 rounded-md border text-[11px] transition-all flex items-center gap-1 ${
                isLast
                  ? 'bg-telemetry-blue/20 border-telemetry-blue/40 text-telemetry-blue-light font-bold shadow-sm'
                  : 'bg-telemetry-elevated/70 border-white/10 text-telemetry-text-muted hover:text-telemetry-text-primary hover:border-white/20'
              }`}
              title={`Ver seção: ${item.label}`}
            >
              {item.label}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
