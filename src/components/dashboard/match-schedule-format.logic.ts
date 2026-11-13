export function formatMatchScheduleDate(scheduledAt?: string | Date | null): string | null {
  if (!scheduledAt) return null;
  const d = typeof scheduledAt === 'string' ? new Date(scheduledAt) : scheduledAt;
  if (isNaN(d.getTime())) return null;

  const datePart = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();

  if (hours === 0 && minutes === 0 && seconds === 0) {
    return datePart;
  }

  const timePart = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${datePart} ${timePart}`;
}

