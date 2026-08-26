import { useMemo } from 'react';
import { calculateAge } from '../rankingConstants';

export function useAge(birthYear: string, birthMonth: string, birthDay: string): number | null {
  return useMemo(() => {
    const year = parseInt(birthYear, 10);
    const month = parseInt(birthMonth, 10);
    const day = parseInt(birthDay, 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return null;
    }

    if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null; // Invalid date like 31/02
    }

    const age = calculateAge(year, month, day);
    if (age < 0) return null;

    return age;
  }, [birthYear, birthMonth, birthDay]);
}
