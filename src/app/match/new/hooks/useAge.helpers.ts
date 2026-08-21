function parseBirthDateParts(birthYear: string, birthMonth: string, birthDay: string) {
  const year = parseInt(birthYear, 10);
  const month = parseInt(birthMonth, 10);
  const day = parseInt(birthDay, 10);
  return { year, month, day };
}

function hasValidDateParts(parts: { year: number; month: number; day: number }): boolean {
  const { year, month, day } = parts;
  return !isNaN(year) && !isNaN(month) && !isNaN(day)
    && year >= 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

function matchesCalendar(parts: { year: number; month: number; day: number }): boolean {
  const { year, month, day } = parts;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function parseBirthDate(
  birthYear: string,
  birthMonth: string,
  birthDay: string,
): { year: number; month: number; day: number } | null {
  const parts = parseBirthDateParts(birthYear, birthMonth, birthDay);
  if (!hasValidDateParts(parts) || !matchesCalendar(parts)) return null;
  return parts;
}
