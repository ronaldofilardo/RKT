/**
 * @jest-environment jsdom
 *
 * Testes para os fixes de UI do menu lateral em DashboardPage:
 * - Hamburger button tem classe text-gray-700 (visibilidade do SVG)
 * - Menu aberto aplica overlay (bg-black/60) e nav lateral (z-[70])
 * - Itens do menu têm text-gray-900 (texto legível sobre fundo branco)
 * - Nav tem select-none (bloqueia seleção nativa do Chrome)
 * - Foco visível com ring sky-500
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';
import { useRouter, usePathname } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/components/dashboard/MatchCard', () => ({
  MatchCard: () => <div data-testid="match-card" />,
}));

jest.mock('@/components/Toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('@/contexts/SessionContext', () => ({
  useSession: () => ({
    setSession: jest.fn(),
    setPendingEdit: jest.fn(),
    writeToSessionStorage: jest.fn(),
  }),
}));

jest.mock('@/lib/matchConfig', () => ({
  getMatchFormatRules: jest.fn(),
  validateSetScore: jest.fn(),
  isMatchTiebreakActive: jest.fn(),
}));

const buildJwt = (payload: object): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${p}.sig`;
};

const setupSessionStorage = (initial: Record<string, string> = {}) => {
  const store: Record<string, string> = { ...initial };
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: jest.fn((k: string) => store[k] ?? null),
      setItem: jest.fn((k: string, v: string) => { store[k] = v; }),
      removeItem: jest.fn((k: string) => { delete store[k]; }),
      clear: jest.fn(() => { for (const k of Object.keys(store)) delete store[k]; }),
    },
    writable: true,
  });
  return store;
};

const setupAuth = () => {
  const futureExp = Math.floor(Date.now() / 1000) + 3600;
  setupSessionStorage({
    user_id: 'user-1',
    user_role: 'ATHLETE',
    access_token: buildJwt({ sub: 'u', exp: futureExp }),
  });
};

const mockFetchEmpty = () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ matches: [] }),
    } as any)
  ) as any;
};

describe('DashboardPage - hamburger visível (TD-046)', () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    mockFetchEmpty();
  });

  it('botão hamburger tem classe text-gray-700 para visibilidade do SVG', async () => {
    setupAuth();
    render(<DashboardPage />);

    await waitFor(() => screen.getByTestId('hamburger-menu-button'));
    const btn = screen.getByTestId('hamburger-menu-button');
    expect(btn.className).toContain('text-gray-700');
  });

  it('SVG dentro do hamburger tem classe text-gray-700', async () => {
    setupAuth();
    render(<DashboardPage />);

    await waitFor(() => screen.getByTestId('hamburger-menu-button'));
    const svg = screen.getByTestId('hamburger-menu-button').querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.className.baseVal).toContain('text-gray-700');
  });
});

describe('DashboardPage - menu lateral aberto (TD-046)', () => {
  const mockRouter = { push: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    mockFetchEmpty();
  });

  const openMenu = async () => {
    render(<DashboardPage />);
    const btn = await waitFor(() => screen.getByTestId('hamburger-menu-button'));
    fireEvent.click(btn);
    await waitFor(() => screen.getByLabelText('Fechar menu'));
    return btn;
  };

  it('overlay tem bg-black/60 quando menu está aberto', async () => {
    setupAuth();
    await openMenu();
    const overlay = document.querySelector('[aria-hidden="true"].bg-black\\/60');
    expect(overlay).not.toBeNull();
  });

  it('nav lateral tem select-none para bloquear seleção de texto', async () => {
    setupAuth();
    await openMenu();
    const nav = screen.getByRole('navigation', { name: /menu/i });
    expect(nav.className).toContain('select-none');
  });

  it('itens do menu têm text-gray-900 para contraste legível', async () => {
    setupAuth();
    await openMenu();
    const inicioItems = screen.getAllByText(/Início/i);
    const menuItemBtn = inicioItems[1].closest('button');
    expect(menuItemBtn?.className).toContain('text-gray-900');
  });

  it('overlay tem z-[60] acima do header sticky (z-40)', async () => {
    setupAuth();
    await openMenu();
    const overlay = document.querySelector('[aria-hidden="true"].bg-black\\/60');
    expect(overlay?.className).toContain('z-[60]');
  });

  it('nav lateral tem z-[70] acima do overlay (z-[60])', async () => {
    setupAuth();
    await openMenu();
    const nav = screen.getByRole('navigation', { name: /menu/i });
    expect(nav.className).toContain('z-[70]');
  });

  it('itens do menu têm focus ring sky-500 para acessibilidade', async () => {
    setupAuth();
    await openMenu();
    const inicioItems = screen.getAllByText(/Início/i);
    const menuItemBtn = inicioItems[1].closest('button');
    expect(menuItemBtn?.className).toContain('focus-visible:ring-sky-500');
  });
});
