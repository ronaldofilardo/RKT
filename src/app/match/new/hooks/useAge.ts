import { useMemo } from 'react';
import { calculateAge } from '../rankingConstants';
import { parseBirthDate } from './useAge.helpers';

export function useAge(birthYear: string, birthMonth: string, birthDay: string): number | null {
  return useMemo(() => {
    const parsedDate = parseBirthDate(birthYear, birthMonth, birthDay);
    if (!parsedDate) return null;

    const age = calculateAge(parsedDate.year, parsedDate.month, parsedDate.day);
    if (age < 0) return null;

    return age;
  }, [birthYear, birthMonth, birthDay]);
}
