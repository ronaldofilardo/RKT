'use client';

import { useDateTimeScheduleModal } from './use-date-time-schedule-modal';
import { DateTimePickerInput } from './date-time-picker-input';
import { ScheduleConfirmModal } from './schedule-confirm-modal';

interface DateTimeSectionProps {
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}

export function DateTimeSection({ date, time, onDateChange, onTimeChange }: DateTimeSectionProps) {
  const { showModal, modalData, handleConfirm, handleCancel } = useDateTimeScheduleModal(date, time);

  return (
    <>
      <section className="bg-telemetry-card rounded-xl border border-white/10 p-4">
      <h2 className="text-base font-semibold text-telemetry-text-primary mb-3">DATA E HORÁRIO</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="match-date" className="block text-sm font-medium text-telemetry-text-muted mb-1">Data *</label>
          <DateTimePickerInput id="match-date" type="date" value={date} onChange={onDateChange} />
        </div>
        <div>
          <label htmlFor="match-time" className="block text-sm font-medium text-telemetry-text-muted mb-1">
            Horário <span className="font-normal">(opcional)</span>
          </label>
          <DateTimePickerInput id="match-time" type="time" value={time} onChange={onTimeChange} />
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mt-4 flex items-start gap-3">
        <span className="text-amber-400 text-base leading-none" aria-hidden="true">
          ⚠️
        </span>
        <div>
          <h3 className="text-xs font-semibold text-amber-400">
            Atenção
          </h3>
          <p className="text-[11px] text-amber-400/80 mt-0.5 leading-snug">
            Certifique-se de confirmar o horário, regras de jogo e os jogadores antes de criar a partida.
            Após o início, a maioria dessas configurações não poderá ser alterada.
          </p>
        </div>
      </div>
    </section>

    {showModal && (
      <ScheduleConfirmModal
        date={modalData.date}
        time={modalData.time}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    )}
    </>
  );
}
