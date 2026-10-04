'use client';

import { useEffect, useRef, useState } from 'react';
import { isMatchScheduledForFuture } from '../schedule-check.helpers';

interface DateTimeSectionProps {
  date: string;
  time: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}

export function DateTimeSection({ date, time, onDateChange, onTimeChange }: DateTimeSectionProps) {
  const lastAlertedRef = useRef<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ date: '', time: '' });

  useEffect(() => {
    if (date && time && isMatchScheduledForFuture(date, time)) {
      const currentVal = `${date}-${time}`;
      if (lastAlertedRef.current !== currentVal) {
        lastAlertedRef.current = currentVal;
        const [year, month, day] = date.split('-');
        const formattedDate = `${day}/${month}/${year}`;
        setModalData({ date: formattedDate, time });
        setShowModal(true);
      }
    } else if (date && time && !isMatchScheduledForFuture(date, time)) {
      lastAlertedRef.current = null;
    }
  }, [date, time]);

  const handleConfirm = () => {
    setShowModal(false);
    // Foca no campo Torneio
    const tournamentInput = document.querySelector('input[placeholder="Nome do torneio"]') as HTMLInputElement;
    if (tournamentInput) tournamentInput.focus();
  };

  const handleCancel = () => {
    setShowModal(false);
    // Foca no campo Data
    const dateInput = document.getElementById('match-date') as HTMLInputElement;
    if (dateInput) dateInput.focus();
  };

  return (
    <>
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
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        role="presentation"
        onKeyDown={(e) => { if (e.key === 'Escape') handleCancel(); }}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleCancel}
          role="button"
          tabIndex={-1}
          aria-label="Fechar modal"
        />
        <div className="relative bg-telemetry-elevated rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6 text-center">
          <div className="text-4xl mb-4">📅</div>
          <h2 className="text-xl font-bold text-telemetry-text-primary mb-2">Agendar Partida</h2>
          <p className="text-sm text-telemetry-text-muted mb-6">
            A partida será agendada para o dia <strong>{modalData.date}</strong> às <strong>{modalData.time}</strong>. Tem certeza?
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-3 bg-telemetry-active hover:bg-sky-700 text-white font-semibold rounded-xl transition-all"
            >
              Sim, confirmar
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="w-full py-3 bg-telemetry-elevated border-2 border-white/10 text-telemetry-text-primary font-semibold rounded-xl hover:bg-white/5 transition-all"
            >
              Não, alterar data
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
