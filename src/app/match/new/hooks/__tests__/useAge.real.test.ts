/**
 * @jest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { useAge } from '../useAge';

describe('useAge - Regressoes Reais', () => {
  it('deve calcular idade para data de nascimento valida', () => {
    const { result } = renderHook(() => useAge('2000', '6', '15'));
    expect(typeof result.current).toBe('number');
    expect(result.current).toBeGreaterThan(0);
  });

  it('deve retornar null para data inexistente no calendario (ex: 31 de fevereiro)', () => {
    const { result } = renderHook(() => useAge('2020', '2', '31'));
    expect(result.current).toBeNull();
  });

  it('deve retornar null para campos vazios ou invalidos', () => {
    const { result } = renderHook(() => useAge('', '', ''));
    expect(result.current).toBeNull();
  });
});
