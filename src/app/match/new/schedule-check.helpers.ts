/**
 * Helper para verificar se a partida deve ser tratada como "agendada":
 * - Data diferente da data atual (em horário local) OU
 * - Início com mais de 5 minutos da hora atual.
 */
export function isMatchScheduledForFuture(
  dateStr?: string,
  timeStr?: string,
  now: Date = new Date(),
): boolean {
  if (!dateStr || !timeStr) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);

  if (!year || !month || !day || isNaN(hours) || isNaN(minutes)) {
    return false;
  }

  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const nowDay = now.getDate();

  // 1. Data diferente da atual (em termos de dia, mês ou ano local)
  if (year !== nowYear || month !== nowMonth || day !== nowDay) {
    return true;
  }

  // 2. Mesma data, mas horário com mais de 5 minutos da hora atual:
  const scheduledTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const diffMs = scheduledTime.getTime() - now.getTime();
  const fiveMinutesMs = 5 * 60 * 1000;

  return diffMs > fiveMinutesMs;
}
