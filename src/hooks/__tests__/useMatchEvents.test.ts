describe('useMatchEvents', () => {
  let mockClose: jest.Mock;
  let mockEventSourceCtor: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    mockClose = jest.fn();
    mockEventSourceCtor = jest.fn(function (this: any, url: string) {
      this.url = url;
      this.close = mockClose;
    });
    (global as any).EventSource = mockEventSourceCtor;
  });

  afterEach(() => {
    delete (global as any).EventSource;
  });

  it('deve criar EventSource com URL correta', async () => {
    jest.mock('react', () => ({
      ...jest.requireActual('react'),
      useEffect: jest.fn((fn) => fn()),
      useRef: jest.fn((init: any) => ({ current: init })),
      useState: jest.fn((init: any) => {
        const val = typeof init === 'function' ? init() : init;
        return [val, jest.fn()];
      }),
    }));

    const { useMatchEvents } = await import('@/hooks/useMatchEvents');
    useMatchEvents('match-1');

    expect(mockEventSourceCtor).toHaveBeenCalledWith('/api/matches/match-1/events');
  });

  it('não deve criar EventSource se matchId é null', async () => {
    jest.mock('react', () => ({
      ...jest.requireActual('react'),
      useEffect: jest.fn((fn) => fn()),
      useRef: jest.fn((init: any) => ({ current: init })),
      useState: jest.fn((init: any) => {
        const val = typeof init === 'function' ? init() : init;
        return [val, jest.fn()];
      }),
    }));

    const { useMatchEvents } = await import('@/hooks/useMatchEvents');
    useMatchEvents(null);

    expect(mockEventSourceCtor).not.toHaveBeenCalled();
  });

  it('deve fechar EventSource no cleanup', async () => {
    let cleanupFn: (() => void) | undefined;
    jest.mock('react', () => ({
      ...jest.requireActual('react'),
      useEffect: jest.fn((fn: Function) => { cleanupFn = fn(); }),
      useRef: jest.fn((init: any) => ({ current: init })),
      useState: jest.fn((init: any) => {
        const val = typeof init === 'function' ? init() : init;
        return [val, jest.fn()];
      }),
    }));

    const { useMatchEvents } = await import('@/hooks/useMatchEvents');
    useMatchEvents('match-1');

    if (cleanupFn) cleanupFn();

    expect(mockClose).toHaveBeenCalled();
  });

  it('deve fechar EventSource e setar ref como null no cleanup', async () => {
    let cleanupFn: (() => void) | undefined;
    let refObj: any;
    jest.mock('react', () => ({
      ...jest.requireActual('react'),
      useEffect: jest.fn((fn: Function) => { cleanupFn = fn(); }),
      useRef: jest.fn((init: any) => { refObj = { current: init }; return refObj; }),
      useState: jest.fn((init: any) => {
        const val = typeof init === 'function' ? init() : init;
        return [val, jest.fn()];
      }),
    }));

    const { useMatchEvents } = await import('@/hooks/useMatchEvents');
    useMatchEvents('match-1');

    if (cleanupFn) cleanupFn();

    expect(mockClose).toHaveBeenCalled();
    expect(refObj.current).toBeNull();
  });

  it('deve fechar EventSource no onerror', async () => {
    let esInstance: any;
    mockEventSourceCtor.mockImplementation(function (this: any, url: string) {
      this.url = url;
      this.close = mockClose;
      esInstance = this;
    });

    jest.mock('react', () => ({
      ...jest.requireActual('react'),
      useEffect: jest.fn((fn: Function) => { fn(); }),
      useRef: jest.fn((init: any) => ({ current: init })),
      useState: jest.fn((init: any) => {
        const val = typeof init === 'function' ? init() : init;
        return [val, jest.fn()];
      }),
    }));

    const { useMatchEvents } = await import('@/hooks/useMatchEvents');
    useMatchEvents('match-1');

    if (esInstance.onerror) esInstance.onerror();

    expect(mockClose).toHaveBeenCalled();
  });

  it('deve atualizar lastEvent quando onmessage recebe dado válido', async () => {
    let esInstance: any;
    let setStateMock: jest.Mock;
    mockEventSourceCtor.mockImplementation(function (this: any, url: string) {
      this.url = url;
      this.close = mockClose;
      esInstance = this;
    });

    setStateMock = jest.fn();
    jest.mock('react', () => ({
      ...jest.requireActual('react'),
      useEffect: jest.fn((fn: Function) => { fn(); }),
      useRef: jest.fn((init: any) => ({ current: init })),
      useState: jest.fn((init: any) => {
        const val = typeof init === 'function' ? init() : init;
        return [val, setStateMock];
      }),
    }));

    const { useMatchEvents } = await import('@/hooks/useMatchEvents');
    useMatchEvents('match-1');

    const testEvent = { type: 'POINT', data: { winnerId: 'p1' } };
    if (esInstance.onmessage) {
      esInstance.onmessage({ data: JSON.stringify(testEvent) });
    }

    expect(setStateMock).toHaveBeenCalledWith(testEvent);
  });

  it('deve ignorar onmessage com JSON inválido', async () => {
    let esInstance: any;
    let setStateMock: jest.Mock;
    mockEventSourceCtor.mockImplementation(function (this: any, url: string) {
      this.url = url;
      this.close = mockClose;
      esInstance = this;
    });

    setStateMock = jest.fn();
    jest.mock('react', () => ({
      ...jest.requireActual('react'),
      useEffect: jest.fn((fn: Function) => { fn(); }),
      useRef: jest.fn((init: any) => ({ current: init })),
      useState: jest.fn((init: any) => {
        const val = typeof init === 'function' ? init() : init;
        return [val, setStateMock];
      }),
    }));

    const { useMatchEvents } = await import('@/hooks/useMatchEvents');
    useMatchEvents('match-1');

    if (esInstance.onmessage) {
      esInstance.onmessage({ data: 'invalid-json{{{' });
    }

    expect(setStateMock).not.toHaveBeenCalled();
  });
});
