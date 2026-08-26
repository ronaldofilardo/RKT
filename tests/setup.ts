import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
}

if (typeof document === 'undefined') {
  global.window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    location: { href: '', pathname: '/', assign: jest.fn(), reload: jest.fn() },
    history: { pushState: jest.fn(), replaceState: jest.fn(), back: jest.fn() },
  } as any;
}

global.Storage = class Storage {
  private data: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.data[key] || null;
  }
  setItem(key: string, value: string): void {
    this.data[key] = value;
  }
  removeItem(key: string): void {
    delete this.data[key];
  }
  clear(): void {
    this.data = {};
  }
} as any;

if (typeof sessionStorage === 'undefined') {
  Object.defineProperty(global, 'sessionStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
}

if (typeof navigator === 'undefined') {
  Object.defineProperty(global, 'navigator', {
    value: {
      onLine: true,
      userAgent: 'jest',
      clipboard: { writeText: jest.fn(), readText: jest.fn() },
    },
    writable: true,
  });
}

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useRouterState: () => ({ isLoading: false }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { src, alt, ...rest } = props;
    return {
      $$typeof: Symbol.for('react.element'),
      type: 'img',
      props: { src, alt, ...rest },
    };
  },
}));

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  if (typeof globalThis.gc === 'function') {
    globalThis.gc();
  }
});