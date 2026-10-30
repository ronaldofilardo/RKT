import { useMemo } from 'react';
import { calculateAge, calculateAgeFromYear } from '@/lib/ranking/rankingConstants';

export function useAge(birthYear: string, birthMonth?: string, birthDay?: string): number | null {
  return useMemo(() => {
    const year = parseInt(birthYear, 10);
    if (isNaN(year) || year < 1900 || year > 2030) return null;

    const month = birthMonth ? parseInt(birthMonth, 10) : NaN;
    const day = birthDay ? parseInt(birthDay, 10) : NaN;

    if (!isNaN(month) && !isNaN(day)) {
      if (month < 1 || month > 12 || day < 1 || day > 31) return null;
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
      }
      const age = calculateAge(year, month, day);
      return age < 0 ? null : age;
    }

    const age = calculateAgeFromYear(year);
    return age < 0 ? null : age;
  }, [birthYear, birthMonth, birthDay]);
}
