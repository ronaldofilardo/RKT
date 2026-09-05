/**
 * @jest-environment jsdom
 */
export const testEnvironment = 'jsdom';
/**
 * CHARACTERIZATION TESTS — atletas/page.tsx
 *
 * Propósito: Capturar comportamento OBSERVADO da página de atletas
 * Data: 2026-08-18
 * Owner: @qa
 *
 * Comportamentos suspeitos (resolvidos/observações):
 * - sessionStorage access no render — design intencional (client-side auth check)
 * - router.push('/login') no useEffect — comportamento correto de auth redirect
 * - TD-006: error handling agora diferenciado via handleApiError() centralizado (resolved 2026-07-28)
 * - delete modal inline — escolha de design (componente de uso único)
 * - loadAthletes sem cache/otimismo — Refactor pendente (não bug)
 * - formatRankings inline — lógica simples o suficiente para manter no componente
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import React from 'react';

// Mock dos componentes filhos - usando factory functions para evitar hoisting issues
jest.mock('@/app/atletas/EditAthleteModal', () => ({
  __esModule: true,
  default: ({ athlete, isOpen, onClose, onSave }: any) =>
    isOpen ? React.createElement('div', { 'data-testid': 'edit-athlete-modal' },
      React.createElement('h2', null, 'Editar Atleta'),
      React.createElement('input', { defaultValue: athlete?.name || '' }),
      React.createElement('button', { onClick: onClose }, 'Cancelar'),
      React.createElement('button', { onClick: () => onSave({ name: athlete?.name || '' }) }, 'Salvar Alterações')
    ) : null,
  EditAthleteModal: ({ athlete, isOpen, onClose, onSave }: any) =>
    isOpen ? React.createElement('div', { 'data-testid': 'edit-athlete-modal' },
      React.createElement('h2', null, 'Editar Atleta'),
      React.createElement('input', { defaultValue: athlete?.name || '' }),
      React.createElement('button', { onClick: onClose }, 'Cancelar'),
      React.createElement('button', { onClick: () => onSave({ name: athlete?.name || '' }) }, 'Salvar Alterações')
    ) : null,
}), { virtual: true });

jest.mock('@/app/match/new/components/NewAthleteModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onCreated }: any) =>
    isOpen ? React.createElement('div', { 'data-testid': 'new-athlete-modal' },
      React.createElement('h2', null, 'Novo Atleta'),
      React.createElement('button', { onClick: onClose }, 'Fechar'),
      React.createElement('button', { onClick: onCreated }, 'Criar')
    ) : null,
  NewAthleteModal: ({ isOpen, onClose, onCreated }: any) =>
    isOpen ? React.createElement('div', { 'data-testid': 'new-athlete-modal' },
      React.createElement('h2', null, 'Novo Atleta'),
      React.createElement('button', { onClick: onClose }, 'Fechar'),
      React.createElement('button', { onClick: onCreated }, 'Criar')
    ) : null,
}), { virtual: true });

import AtletasPage from '@/app/atletas/page';

// Mock de fetch global
global.fetch = jest.fn();

// Mock de next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
}), { virtual: true });

// Mock do logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}), { virtual: true });

const mockAthletes = [
  {
    id: 'p1',
    name: 'Eduardo',
    gender: 'MALE',
    birthDate: '2010-03-15',
    age: 15,
    dominance: 'RIGHT',
    backhand: 'ONE_HANDED',
    rankings: {
      ESTADUAL: { category: '15-16', class: '4ªMA', position: 3 },
    },
  },
  {
    id: 'p2',
    name: 'Maria',
    gender: 'FEMALE',
    birthDate: '2008-07-22',
    age: 17,
    dominance: 'LEFT',
    backhand: 'TWO_HANDED',
    rankings: {
      CBT: { category: '17-18', position: 5 },
      ITF: { category: '17-18', class: 'A', position: 12, juvenilePosition: 3 },
    },
  },
  {
    id: 'p3',
    name: 'João',
    gender: 'MALE',
    birthDate: '2012-01-10',
    age: 13,
    dominance: 'RIGHT',
    backhand: 'ONE_HANDED',
    rankings: null,
  },
];

// SessionStorageMock utility
class SessionStorageMock {
  private store: Map<string, string | null>;
  private original: Storage;

  constructor(initialData: Record<string, string | null> = {}) {
    this.store = new Map(Object.entries(initialData));
    this.original = global.sessionStorage;
  }

  install() {
    Object.defineProperty(global, 'sessionStorage', {
      value: {
        getItem: (key: string) => this.store.get(key) ?? null,
        setItem: (key: string, value: string) => this.store.set(key, value),
        removeItem: (key: string) => this.store.delete(key),
        clear: () => this.store.clear(),
        get length() { return this.store.size; },
        key: (index: number) => Array.from(this.store.keys())[index] ?? null,
      },
      writable: true,
    });
  }

  uninstall() {
    Object.defineProperty(global, 'sessionStorage', {
      value: this.original,
      writable: true,
    });
  }

  setItem(key: string, value: string | null) {
    if (value === null) {
      this.store.delete(key);
    } else {
      this.store.set(key, value);
    }
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
}

describe('AtletasPage (characterization)', () => {
  let mockSessionStorage: SessionStorageMock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();

    // Mock sessionStorage
    mockSessionStorage = new SessionStorageMock({
      access_token: 'mock-token-123',
      user_id: 'user-456',
      user_role: 'COACH',
    });
    mockSessionStorage.install();

    // Mock fetch para loadAthletes
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { players: mockAthletes } }),
    });
  });

  afterEach(() => {
    mockSessionStorage.uninstall();
    jest.resetModules();
  });

  describe('Mount & Auth', () => {
    it('deve redirecionar para /login quando não há user_role', async () => {
      mockSessionStorage.setItem('user_role', null);
      mockSessionStorage.setItem('access_token', 'token');

      render(<AtletasPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('deve redirecionar para /login quando não há access_token', async () => {
      mockSessionStorage.setItem('user_role', 'COACH');
      mockSessionStorage.setItem('access_token', null);

      render(<AtletasPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });


    it('deve chamar loadAthletes no mount quando autenticado', async () => {
      render(<AtletasPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/players?userId=user-456',
          expect.objectContaining({
            headers: expect.objectContaining({
              authorization: 'Bearer mock-token-123',
            }),
          })
        );
      });
    });
  });

  describe('Loading State', () => {
    it('deve mostrar "Carregando..." enquanto loading', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ data: { players: [] } }),
        }), 100))
      );

      render(<AtletasPage />);

      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });

    it('deve esconder loading após carregar atletas', async () => {
      render(<AtletasPage />);

      await waitFor(() => {
        expect(screen.queryByText('Carregando...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('deve mostrar estado vazio quando nenhum atleta', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { players: [] } }),
      });

      render(<AtletasPage />);

      await waitFor(() => {
        expect(screen.getByText('Nenhum atleta cadastrado')).toBeInTheDocument();
        expect(screen.getByText('Cadastre atletas para começar a utilizar o sistema.')).toBeInTheDocument();
      });
    });

    it('deve mostrar contador 0 no header', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ data: { players: [] } }),
      });

      render(<AtletasPage />);

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });
  });

  describe('Athlete List Rendering', () => {
    beforeEach(async () => {
      render(<AtletasPage />);
      await waitFor(() => {
        expect(screen.getByText('Eduardo')).toBeInTheDocument();
      });
    });

    it('deve renderizar todos os atletas na tabela', async () => {
      expect(screen.getByText('Eduardo')).toBeInTheDocument();
      expect(screen.getByText('Maria')).toBeInTheDocument();
      expect(screen.getByText('João')).toBeInTheDocument();
    });

    it('deve mostrar contador correto no header', async () => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('deve mostrar idade quando disponível', async () => {
      expect(screen.getByText('15 anos')).toBeInTheDocument();
      expect(screen.getByText('17 anos')).toBeInTheDocument();
      expect(screen.getByText('13 anos')).toBeInTheDocument();
    });

    it('deve formatar rankings com badge sky', async () => {
      // Eduardo: ESTADUAL #3 (15-16 4ªMA)
      expect(screen.getByText('Estadual #3 (15-16 4ªMA)')).toBeInTheDocument();
      // Maria: CBT #5 (17-18) e ITF #12 (17-18 A) · JJ #3
      expect(screen.getByText('CBT #5 (17-18)')).toBeInTheDocument();
      expect(screen.getByText((content: string) => content.includes('ITF #12') && content.includes('JJ #3'))).toBeInTheDocument();
      // João: sem rankings
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  
});