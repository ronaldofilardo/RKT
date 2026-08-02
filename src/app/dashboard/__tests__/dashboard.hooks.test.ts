/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useDashboardNavigation } from '@/app/dashboard/dashboard.hooks';
import { ensureAuthCookie, readAuthState } from '@/lib/auth-client';

jest.mock('@/lib/auth-client', () => ({
  ensureAuthCookie: jest.fn(),
  readAuthState: jest.fn(),
  redirectToLogin: jest.fn(),
}));

jest.mock('@/lib/jwt-client', () => ({
  isTokenExpired: jest.fn(),
}));

const mockEnsureAuthCookie = ensureAuthCookie as jest.MockedFunction<
  typeof ensureAuthCookie
>;
const mockReadAuthState = readAuthState as jest.MockedFunction<typeof readAuthState>;
const mockIsTokenExpired = require('@/lib/jwt-client').isTokenExpired as jest.MockedFunction<
  typeof import('@/lib/jwt-client').isTokenExpired
>;

describe('useDashboardNavigation', () => {
  it('deve navegar para /match/new quando view for newMatch', () => {
    const push = jest.fn();
    const { result } = renderHook(() => useDashboardNavigation({ push }));

    act(() => {
      result.current.handleNavigate('newMatch');
    });

    expect(push).toHaveBeenCalledWith('/match/new');
  });

  it('deve navegar para /atletas quando view for atletas', () => {
    const push = jest.fn();
    const { result } = renderHook(() => useDashboardNavigation({ push }));

    act(() => {
      result.current.handleNavigate('atletas');
    });

    expect(push).toHaveBeenCalledWith('/atletas');
  });
});
