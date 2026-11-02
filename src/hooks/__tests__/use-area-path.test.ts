/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { useActiveArea, useAreaPath } from '../use-area-path';
import * as navigation from 'next/navigation';

jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

describe('use-area-path.ts', () => {
  it('detecta TREINADOR_AVULSO a partir da pathname /treinador', () => {
    (navigation.usePathname as jest.Mock).mockReturnValue('/treinador/partidasaovivo');
    const { result } = renderHook(() => useActiveArea());
    expect(result.current).toBe('TREINADOR_AVULSO');

    const { result: pathResult } = renderHook(() => useAreaPath());
    expect(pathResult.current('/match/new')).toBe('/treinador/match/new');
  });

  it('detecta ATLETA a partir da pathname /atleta', () => {
    (navigation.usePathname as jest.Mock).mockReturnValue('/atleta');
    const { result } = renderHook(() => useActiveArea());
    expect(result.current).toBe('ATLETA');

    const { result: pathResult } = renderHook(() => useAreaPath());
    expect(pathResult.current('/historico')).toBe('/atleta/historico');
  });

  it('retorna caminho relativo seguro se não houver prefixo de área', () => {
    (navigation.usePathname as jest.Mock).mockReturnValue('/login');
    const { result } = renderHook(() => useActiveArea());
    expect(result.current).toBeNull();

    const { result: pathResult } = renderHook(() => useAreaPath());
    expect(pathResult.current('/dashboard')).toBe('/dashboard');
  });
});
