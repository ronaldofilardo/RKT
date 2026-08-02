/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { useAge } from '../useAge';

describe('useAge', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 6, 23)); // 23/07/2026
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('calculates age correctly for a past date', () => {
    const { result } = renderHook(() => useAge('2000', '07', '22'));
    expect(result.current).toBe(26);
  });

  it('calculates age correctly before birthday', () => {
    const { result } = renderHook(() => useAge('2000', '07', '24'));
    expect(result.current).toBe(25);
  });

  it('returns null for invalid month', () => {
    const { result } = renderHook(() => useAge('2000', '13', '15'));
    expect(result.current).toBeNull();
  });

  it('returns null for invalid day like 31/02', () => {
    const { result } = renderHook(() => useAge('2000', '02', '31'));
    expect(result.current).toBeNull();
  });

  it('returns null for future dates', () => {
    const { result } = renderHook(() => useAge('2027', '01', '01'));
    expect(result.current).toBeNull();
  });

  it('returns null for missing inputs', () => {
    const { result } = renderHook(() => useAge('', '', ''));
    expect(result.current).toBeNull();
  });
});
