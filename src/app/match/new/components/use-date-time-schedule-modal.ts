'use client';

import { useEffect, useRef, useState } from 'react';
import { isMatchScheduledForFuture } from '../schedule-check.helpers';

export function useDateTimeScheduleModal(date: string, time: string) {
  const lastAlertedRef = useRef<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({ date: '', time: '' });

  useEffect(() => {
    if (date && isMatchScheduledForFuture(date, time)) {
      const currentVal = `${date}-${time}`;
      if (lastAlertedRef.current !== currentVal) {
        lastAlertedRef.current = currentVal;
        const [year, month, day] = date.split('-');
        const formattedDate = `${day}/${month}/${year}`;
        setModalData({ date: formattedDate, time: time || '--:--' });
        setShowModal(true);
      }
    } else if (date && !isMatchScheduledForFuture(date, time)) {
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

  return { showModal, modalData, handleConfirm, handleCancel };
}
