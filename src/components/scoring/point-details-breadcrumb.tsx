'use client';

import type { PointDetailsForm, Vencedor } from './point-details-logic';
import {
  SITUACAO_OPTIONS,
  TIPO_LABELS,
  GOLPE_LABELS,
  EFEITO_OPTIONS,
  DIRECAO_LABELS,
  DURACAO_OPTIONS,
  SUBTIPO1_OPTIONS,
} from './point-details-logic';

export type BreadcrumbStep =
  | 'situacao'
  | 'tipo'
  | 'golpe'
  | 'subtipo1'
  | 'efeito'
  | 'direcao'
  | 'duracao';

interface BreadcrumbItem {
  key: BreadcrumbStep;
  label: string;
}

interface PointDetailsBreadcrumbProps {
  form: PointDetailsForm;
  vencedor: Vencedor;
  onNavigateStep?: (step: BreadcrumbStep) => void;
}

export function PointDetailsBreadcrumb({
  form,
  onNavigateStep,
}: PointDetailsBreadcrumbProps) {
  const items: BreadcrumbItem[] = [];

  if (form.situacao) {
    const opt = SITUACAO_OPTIONS.find((o) => o.value === form.situacao);
    items.push({ key: 'situacao', label: opt?.label ?? form.situacao });
  }

  if (form.tipo) {
    items.push({ key: 'tipo', label: TIPO_LABELS[form.tipo] ?? form.tipo });
  }

  if (form.golpe) {
    items.push({ key: 'golpe', label: GOLPE_LABELS[form.golpe] ?? form.golpe });
  }

  if (form.subtipo1) {
    const opt = SUBTIPO1_OPTIONS.find((o) => o.value === form.subtipo1);
    items.push({ key: 'subtipo1', label: opt?.label ?? form.subtipo1 });
  }

  if (form.efeito) {
    const opt = EFEITO_OPTIONS.find((o) => o.value === form.efeito);
    items.push({ key: 'efeito', label: opt?.label ?? form.efeito });
  }

  if (form.direcao) {
    items.push({ key: 'direcao', label: DIRECAO_LABELS[form.direcao] ?? form.direcao });
  }

  if (form.duracao) {
    const opt = DURACAO_OPTIONS.find((o) => o.value === form.duracao);
    items.push({ key: 'duracao', label: opt?.label ?? `${form.duracao} golpes` });
  }

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
