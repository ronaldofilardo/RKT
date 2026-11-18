/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResponsavelOnboardingModal } from '../responsavel-onboarding-modal';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const credentials = { name: 'Mãe Teste', identifier: 'mae@example.com', password: 'senha12345' };

function fillMinorStep() {
  fireEvent.change(screen.getByLabelText('Nome do menor'), { target: { value: 'Menor Silva' } });
  fireEvent.change(screen.getByLabelText('Data de nascimento'), { target: { value: '2015-06-10' } });
  fireEvent.click(screen.getByLabelText(/Declaro que sou o responsável legal/i));
}

describe('ResponsavelOnboardingModal — fluxo de 3 etapas (A0.21)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.Mock;
  });

  it('expõe acessibilidade de diálogo e inicia na escolha de modo', () => {
    render(<ResponsavelOnboardingModal open onOpenChange={jest.fn()} onSuccess={jest.fn()} credentials={credentials} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('1. Modo de acesso')).toBeInTheDocument();
    expect(screen.getByLabelText(/Conta Básica de Acompanhamento/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Conta de Espectador & Responsável/)).toBeInTheDocument();
  });

  it('não renderiza nada quando fechado', () => {
    render(<ResponsavelOnboardingModal open={false} onOpenChange={jest.fn()} onSuccess={jest.fn()} credentials={credentials} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('avança da etapa 1 para a etapa 2 (dados do menor)', () => {
    render(<ResponsavelOnboardingModal open onOpenChange={jest.fn()} onSuccess={jest.fn()} credentials={credentials} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText(/Dados do menor dependente/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do menor')).toBeInTheDocument();
  });

  it('bloqueia o avanço com data de nascimento de maior de idade', async () => {
    render(<ResponsavelOnboardingModal open onOpenChange={jest.fn()} onSuccess={jest.fn()} credentials={credentials} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.change(screen.getByLabelText('Nome do menor'), { target: { value: 'Adulto Silva' } });
    fireEvent.change(screen.getByLabelText('Data de nascimento'), { target: { value: '1990-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/menores de 18 anos/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('cria a conta (etapa 2) e segue para a indicação de equipe (etapa 3)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ playerId: 'p-1', role: 'RESPONSAVEL', redirect: '/responsavel' }),
    });

    render(<ResponsavelOnboardingModal open onOpenChange={jest.fn()} onSuccess={jest.fn()} credentials={credentials} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fillMinorStep();
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    await waitFor(() => expect(screen.getByText(/Equipe técnica do menor/i)).toBeInTheDocument());
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/auth/signup');
    const body = JSON.parse(options.body);
    expect(body.role).toBe('RESPONSAVEL');
    expect(body.guardianProfile).toEqual(
      expect.objectContaining({ accessMode: 'BASIC', minorName: 'Menor Silva', relationship: 'PAI', purposes: ['DATA'] }),
    );
  });

  it('marca BROADCAST mantendo DATA obrigatório e envia na tríade', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ playerId: 'p-1' }) });

    render(<ResponsavelOnboardingModal open onOpenChange={jest.fn()} onSuccess={jest.fn()} credentials={credentials} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fillMinorStep();
    fireEvent.click(screen.getByLabelText(/BROADCAST/));
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.guardianProfile.purposes).toEqual(['DATA', 'BROADCAST']);
  });

  it('pula a etapa 3 e redireciona para /responsavel', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ playerId: 'p-1' }) });
    const onSuccess = jest.fn();

    render(<ResponsavelOnboardingModal open onOpenChange={jest.fn()} onSuccess={onSuccess} credentials={credentials} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fillMinorStep();
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    await waitFor(() => expect(screen.getByText(/Equipe técnica do menor/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Pular e configurar depois/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/responsavel'));
    expect(onSuccess).toHaveBeenCalled();
  });

  it('exibe erro do backend sem perder o preenchimento', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Este menor já possui um responsável legal ativo.' }),
    });

    render(<ResponsavelOnboardingModal open onOpenChange={jest.fn()} onSuccess={jest.fn()} credentials={credentials} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fillMinorStep();
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect(await screen.findByText('Este menor já possui um responsável legal ativo.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome do menor')).toHaveValue('Menor Silva');
  });
});
