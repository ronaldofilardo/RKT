/**
 * @jest-environment jsdom
 */

jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useModalStack } from '@/hooks/useModalStack';

const mockSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;
const mockRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockPathname = usePathname as jest.MockedFunction<typeof usePathname>;

function createMockSearchParams(params: Record<string, string> = {}) {
  return {
    get: jest.fn((key: string) => params[key] ?? null),
    toString: jest.fn(() => new URLSearchParams(params).toString()),
    entries: jest.fn(() => Object.entries(params)[Symbol.iterator]()),
    forEach: jest.fn(function (this: any, cb: (value: string, key: string) => void) {
      Object.entries(params).forEach(([k, v]) => cb(v, k));
    }),
  } as any;
}

function renderHook(hook: () => any) {
  const result = { current: null as any };
  const container = document.createElement('div');
  const root = createRoot(container);

  function TestComponent() {
    result.current = hook();
    return null;
  }

  act(() => { root.render(React.createElement(TestComponent)); });

  return {
    result,
    rerender: () => act(() => { root.render(React.createElement(TestComponent)); }),
    unmount: () => act(() => { root.unmount(); }),
  };
}

describe('useModalStack — estabilidade de referência', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.mockReturnValue(createMockSearchParams());
    mockRouter.mockReturnValue({ push: mockPush, replace: mockReplace, back: mockBack } as any);
    mockPathname.mockReturnValue('/test');
  });

  it('open deve manter referência estável quando searchParams muda', () => {
    const { result, rerender } = renderHook(() => useModalStack());
    const openRef1 = result.current.open;

    mockSearchParams.mockReturnValue(createMockSearchParams({ modal: 'other' }));
    rerender();

    const openRef2 = result.current.open;
    expect(openRef1).toBe(openRef2);
  });

  it('replace deve manter referência estável quando searchParams muda', () => {
    const { result, rerender } = renderHook(() => useModalStack());
    const replaceRef1 = result.current.replace;

    mockSearchParams.mockReturnValue(createMockSearchParams({ modal: 'other' }));
    rerender();

    const replaceRef2 = result.current.replace;
    expect(replaceRef1).toBe(replaceRef2);
  });

  it('closeAll deve manter referência estável quando searchParams muda', () => {
    const { result, rerender } = renderHook(() => useModalStack());
    const closeAllRef1 = result.current.closeAll;

    mockSearchParams.mockReturnValue(createMockSearchParams({ modal: 'other' }));
    rerender();

    const closeAllRef2 = result.current.closeAll;
    expect(closeAllRef1).toBe(closeAllRef2);
  });

  it('open deve usar searchParams atualizados (via ref) após mudança de URL', () => {
    const { result, rerender } = renderHook(() => useModalStack());

    mockSearchParams.mockReturnValue(createMockSearchParams({ existing: 'value' }));
    rerender();

    act(() => {
      result.current.open('new-modal');
    });

    expect(mockPush).toHaveBeenCalledWith('/test?existing=value&modal=new-modal');
  });

  it('closeAll deve usar searchParams atualizados (via ref) após mudança de URL', () => {
    const { result, rerender } = renderHook(() => useModalStack());

    mockSearchParams.mockReturnValue(createMockSearchParams({ modal: 'old', extra: 'param' }));
    rerender();

    act(() => {
      result.current.closeAll();
    });

    expect(mockReplace).toHaveBeenCalledWith('/test?extra=param');
  });
});
