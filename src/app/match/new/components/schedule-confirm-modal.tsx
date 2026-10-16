'use client';

interface ScheduleConfirmModalProps {
  date: string;
  time: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ScheduleConfirmModal({ date, time, onConfirm, onCancel }: ScheduleConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
      onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        role="button"
        tabIndex={-1}
        aria-label="Fechar modal"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCancel();
          }
        }}
      />
      <div className="relative bg-telemetry-elevated rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 text-center">
        <div className="text-4xl mb-4">📅</div>
        <h2 className="text-xl font-bold text-telemetry-text-primary mb-2">Agendar Partida</h2>
        <p className="text-sm text-telemetry-text-muted mb-6">
          A partida será agendada para o dia <strong>{date}</strong>{time && time !== '--:--' ? <> às <strong>{time}</strong></> : ''}. Tem certeza?
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full py-3 bg-telemetry-active hover:bg-sky-700 text-white font-semibold rounded-xl transition-all"
          >
            Sim, confirmar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full py-3 bg-telemetry-elevated border-2 border-white/10 text-telemetry-text-primary font-semibold rounded-xl hover:bg-white/5 transition-all"
          >
            Não, alterar data
          </button>
        </div>
      </div>
    </div>
  );
}
