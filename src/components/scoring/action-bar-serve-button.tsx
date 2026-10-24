import type { ReactNode } from 'react';

export type ServeButtonVariant = 'ace' | 'fault' | 'double-fault' | 'net';

/**
 * Padrão Broadcast Telemetry (Stitch / Court Precision Tech):
 * Superfície elevada escura unificada com acentos luminescentes cirúrgicos.
 */
const VARIANT_STYLES: Record<ServeButtonVariant, string> = {
  ace: 'bg-telemetry-elevated text-telemetry-volt border-telemetry-volt/60 hover:border-telemetry-volt hover:bg-telemetry-active active:bg-telemetry-volt/15 shadow-[0_0_12px_rgba(204,255,0,0.12)] focus-visible:ring-telemetry-volt',
  fault:
    'bg-telemetry-elevated text-red-400 border-telemetry-error/40 hover:border-telemetry-error/70 hover:bg-telemetry-active active:bg-telemetry-error/15 shadow-[0_0_8px_rgba(239,68,68,0.08)] focus-visible:ring-telemetry-error',
  'double-fault':
    'bg-telemetry-error/20 text-red-200 border-telemetry-error hover:bg-telemetry-error/30 active:bg-telemetry-error/40 shadow-[0_0_14px_rgba(239,68,68,0.25)] focus-visible:ring-telemetry-error',
  net:
    'bg-telemetry-elevated text-slate-200 border-white/20 hover:border-white/40 hover:bg-telemetry-active active:bg-white/10 shadow-[0_0_8px_rgba(255,255,255,0.05)] focus-visible:ring-white/40',
};

export function ServeButton({
  onClick,
  disabled,
  variant,
  subLabel,
  icon,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant: ServeButtonVariant;
  subLabel?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border px-2 py-2.5 text-sm sm:text-base font-bold tracking-wide select-none transition-all min-h-[52px] sm:min-h-[56px] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANT_STYLES[variant]}`}
    >
      <div className="flex items-center justify-center gap-1.5 leading-none">
        {icon && (
          <span aria-hidden="true" className="flex items-center justify-center text-sm sm:text-base">
            {icon}
          </span>
        )}
        <span>{children}</span>
      </div>
      {subLabel && (
        <span
          aria-hidden="true"
          className="text-[10px] font-bold uppercase tracking-wider leading-none opacity-90"
        >
          {subLabel}
        </span>
      )}
    </button>
  );
}
