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
    unmount: () => act(() => { root.unmount(); }),
  };
}

describe('useModalStack', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams.mockReturnValue(createMockSearchParams());
    mockRouter.mockReturnValue({ push: mockPush, replace: mockReplace, back: mockBack } as any);
    mockPathname.mockReturnValue('/test');
  });

  it('deve retornar activeModal null quando não há modal na URL', () => {
    const { result } = renderHook(() => useModalStack());
    expect(result.current.activeModal).toBeNull();
  });

  it('deve retornar o modal ativo da URL', () => {
    mockSearchParams.mockReturnValue(createMockSearchParams({ modal: 'test-modal' }));
    const { result } = renderHook(() => useModalStack());
    expect(result.current.activeModal).toBe('test-modal');
  });

  it('deve retornar modalParams sem a chave modal', () => {
    mockSearchParams.mockReturnValue(
      createMockSearchParams({ modal: 'test-modal', winner: 'player1' })
    );
    const { result } = renderHook(() => useModalStack());
    expect(result.current.modalParams).toEqual({ winner: 'player1' });
  });

  it('open deve chamar router.push com a URL correta', () => {
    const { result } = renderHook(() => useModalStack());

    act(() => {
      result.current.open('my-modal', { key1: 'val1' });
    });

    expect(mockPush).toHaveBeenCalledWith('/test?modal=my-modal&key1=val1');
  });

  it('open sem params deve chamar router.push com só modal', () => {
    const { result } = renderHook(() => useModalStack());

    act(() => {
      result.current.open('simple-modal');
    });

    expect(mockPush).toHaveBeenCalledWith('/test?modal=simple-modal');
  });

  it('open deve preservar search params existentes', () => {
    mockSearchParams.mockReturnValue(createMockSearchParams({ existing: 'keep' }));
    const { result } = renderHook(() => useModalStack());

    act(() => {
      result.current.open('modal-name');
    });

    expect(mockPush).toHaveBeenCalledWith('/test?existing=keep&modal=modal-name');
  });

  it('replace deve chamar router.replace com a URL correta', () => {
    const { result } = renderHook(() => useModalStack());

    act(() => {
      result.current.replace('replaced-modal');
    });

    expect(mockReplace).toHaveBeenCalledWith('/test?modal=replaced-modal');
  });

  it('close deve chamar router.back', () => {
    const { result } = renderHook(() => useModalStack());

    act(() => {
      result.current.close();
    });

    expect(mockBack).toHaveBeenCalled();
  });

  it('closeAll deve remover modal da URL', () => {
    mockSearchParams.mockReturnValue(createMockSearchParams({ modal: 'active', other: 'keep' }));
    const { result } = renderHook(() => useModalStack());

    act(() => {
      result.current.closeAll();
    });

    expect(mockReplace).toHaveBeenCalledWith('/test?other=keep');
  });

  it('closeAll sem outros params deve limpar apenas modal', () => {
    mockSearchParams.mockReturnValue(createMockSearchParams({ modal: 'active' }));
    const { result } = renderHook(() => useModalStack());

    act(() => {
      result.current.closeAll();
    });

    expect(mockReplace).toHaveBeenCalledWith('/test');
  });
});
