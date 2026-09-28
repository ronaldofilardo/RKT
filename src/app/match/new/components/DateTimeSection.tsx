'use client';

interface DateTimeSectionProps {
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}

export function DateTimeSection({ date, time, onDateChange, onTimeChange }: DateTimeSectionProps) {
  return (
    <section className="bg-telemetry-card rounded-xl border border-white/10 p-4">
      <h2 className="text-base font-semibold text-telemetry-text-primary mb-3">DATA E HORÁRIO *</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="match-date" className="block text-sm font-medium text-telemetry-text-muted mb-1">Data</label>
          <input
            id="match-date"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary"
          />
        </div>
        <div>
          <label htmlFor="match-time" className="block text-sm font-medium text-telemetry-text-muted mb-1">Horário</label>
          <input
            id="match-time"
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className="w-full px-3 py-2 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-telemetry-elevated text-telemetry-text-primary"
          />
        </div>
      </div>
    </section>
  );
}
