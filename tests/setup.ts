import '@testing-library/jest-dom';

if (typeof document === 'undefined') {
  global.window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    location: { href: '', pathname: '/' },
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
    },
    writable: true,
  });
}

if (typeof navigator === 'undefined') {
  Object.defineProperty(global, 'navigator', {
    value: {
      onLine: true,
    },
    writable: true,
  });
}
