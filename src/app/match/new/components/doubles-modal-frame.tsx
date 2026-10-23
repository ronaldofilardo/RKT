import type { ReactNode } from 'react';

interface DoublesModalFrameProps {
  onClose: () => void;
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function DoublesModalFrame({
  onClose,
  title,
  subtitle,
  children,
}: DoublesModalFrameProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        role="button"
        tabIndex={-1}
        aria-label="Fechar modal"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || e.key === 'Enter') onClose();
        }}
      />
      <div className="relative bg-telemetry-elevated rounded-2xl shadow-2xl max-w-lg w-full p-6 text-left border border-white/10 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-telemetry-text-primary mb-1 text-center">
          {title}
        </h2>
        <p className="text-xs text-telemetry-text-muted mb-6 text-center">
          {subtitle}
        </p>
        {children}
      </div>
    </div>
  );
}
