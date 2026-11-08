/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import OnboardingPage from '../page';
import { onboardingStorageKey } from '@/lib/onboarding';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}));

function mockMe(data: Record<string, unknown>) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({
      user: { id: 'u-1', role: 'ATLETA', name: 'Ana' },
      activeArea: 'ATLETA',
      availableAreas: [],
      ...data,
    }),
  });
}

describe('OnboardingPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = jest.fn() as jest.Mock;
    mockSearchParams.delete('next');
    mockSearchParams.delete('perfil');
  });

  it('percorre as três etapas e conclui marcando o usuário', async () => {
    mockMe({});
    render(<OnboardingPage />);

    expect(await screen.findByText('O que é o RKT e a telemetria de tênis')).toBeInTheDocument();
    expect(screen.getByText('Etapa 1 de 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    expect(screen.getByText('Como ler seus gráficos de momentum e saque')).toBeInTheDocument();
    expect(screen.getByText('Etapa 2 de 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    expect(screen.getByText('Crie ou busque sua primeira partida')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/atleta'));
    expect(window.localStorage.getItem(onboardingStorageKey('u-1'))).toBe('1');
  });

  it('permite pular a introdução e ir direto ao painel', async () => {
    mockMe({});
    render(<OnboardingPage />);

    await screen.findByText('O que é o RKT e a telemetria de tênis');
    fireEvent.click(screen.getByRole('button', { name: 'Pular Introdução' }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/atleta'));
    expect(window.localStorage.getItem(onboardingStorageKey('u-1'))).toBe('1');
  });

  it('respeita o destino seguro recebido em next', async () => {
    mockSearchParams.set('next', '/escolher-area');
    mockMe({ activeArea: null });
    render(<OnboardingPage />);

    await screen.findByText('O que é o RKT e a telemetria de tênis');
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Avançar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/escolher-area'));
  });

  it('infere o perfil por availableAreas quando não há área ativa', async () => {
    window.localStorage.setItem(onboardingStorageKey('u-1'), '1');
    mockMe({
      activeArea: null,
      availableAreas: [{ code: 'ATLETA' }],
      user: { id: 'u-1', role: 'ANNOTATOR', name: 'Ana' },
    });
    render(<OnboardingPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/atleta'));
  });

  it('não repete a introdução para quem já concluiu', async () => {
    window.localStorage.setItem(onboardingStorageKey('u-1'), '1');
    mockMe({});
    render(<OnboardingPage />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/atleta'));
    expect(screen.queryByText('O que é o RKT e a telemetria de tênis')).not.toBeInTheDocument();
  });
});
