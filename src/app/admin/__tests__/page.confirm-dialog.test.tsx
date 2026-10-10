/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AdminPage from '../page';

const mockPush = jest.fn();
// Router ESTÁVEL: a página usa `router` como dependência de useEffect; um objeto
// novo a cada render causaria loop infinito de renderização.
const mockRouter = { push: mockPush, replace: jest.fn() };

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

const USERS = [
  { id: 'u1', name: 'Maria Souza', email: 'maria@example.com', role: 'ANNOTATOR', club: null, createdAt: '2026-01-01' },
];

function mockFetch() {
  const fn = jest.fn(async (_url: string, init?: RequestInit) => {
    if (init?.method === 'DELETE') return { ok: true, json: async () => ({}) } as Response;
    return { ok: true, json: async () => ({ data: { users: USERS } }) } as Response;
  });
  (global as any).fetch = fn;
  return fn;
}

async function renderAdminWithUsers() {
  render(<AdminPage />);
  fireEvent.click(await screen.findByRole('button', { name: 'Gerenciar' }));
  await screen.findByText('Maria Souza');
}

describe('AdminPage — guarda de autenticação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockFetch();
  });

  it('NÃO redireciona para /login quando há user_role mesmo sem access_token no sessionStorage (token no cookie httpOnly)', async () => {
    sessionStorage.setItem('user_role', 'ADMIN');

    render(<AdminPage />);

    expect(await screen.findByRole('button', { name: 'Gerenciar' })).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalledWith('/login');
  });

  it('redireciona para /login quando não há user_role', async () => {
    render(<AdminPage />);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
  });
});

describe('AdminPage — confirmações com alertdialog (sem confirm() nativo)', () => {
  let confirmSpy: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem('user_role', 'ADMIN');
    sessionStorage.setItem('access_token', 'token-123');
    confirmSpy = jest.fn(() => true);
    window.confirm = confirmSpy;
  });

  describe('Sair', () => {
    it('abre o alertdialog em vez de window.confirm e só sai ao confirmar', async () => {
      mockFetch();
      render(<AdminPage />);

      fireEvent.click(await screen.findByRole('button', { name: 'Sair' }));

      const dialog = await screen.findByRole('alertdialog');
      expect(confirmSpy).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalledWith('/login');
      expect(sessionStorage.getItem('access_token')).toBe('token-123');

      fireEvent.click(within(dialog).getByRole('button', { name: 'Sair' }));

      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(sessionStorage.getItem('access_token')).toBeNull();
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('Cancelar fecha o diálogo sem sair', async () => {
      mockFetch();
      render(<AdminPage />);

      fireEvent.click(await screen.findByRole('button', { name: 'Sair' }));
      fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }));

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalledWith('/login');
      expect(sessionStorage.getItem('access_token')).toBe('token-123');
    });
  });

  describe('Excluir usuário', () => {
    it('mostra o usuário no alertdialog e NÃO exclui antes de confirmar', async () => {
      const fetchMock = mockFetch();
      await renderAdminWithUsers();

      fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));

      const dialog = await screen.findByRole('alertdialog', { name: 'Excluir usuário?' });
      expect(dialog).toHaveTextContent('Maria Souza');
      expect(dialog).toHaveTextContent('maria@example.com');
      expect(confirmSpy).not.toHaveBeenCalled();
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);
    });

    it('Cancelar não dispara a exclusão', async () => {
      const fetchMock = mockFetch();
      await renderAdminWithUsers();

      fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
      fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cancelar' }));

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);
    });

    it('Confirmar chama DELETE do usuário correto, recarrega a lista e fecha o diálogo', async () => {
      const fetchMock = mockFetch();
      await renderAdminWithUsers();

      fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
      fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Excluir' }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/admin/users/u1',
          expect.objectContaining({ method: 'DELETE', headers: { authorization: 'Bearer token-123' } }),
        );
      });
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    });
  });
});
