/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { ConviteSuccessCard } from '../convite/[token]/convite-success-card';

describe('ConviteSuccessCard', () => {
  it('informa que o link do menor será enviado pelo gestor e oferece criação de conta e login', () => {
    render(<ConviteSuccessCard minorName="Pedro" token="tok-123" />);
    expect(screen.getByText('Autorização Confirmada com Sucesso!')).toBeInTheDocument();
    expect(screen.getByText(/O gestor do clube enviará um link ao atleta menor/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Criar \/ Ativar Conta de Responsável/i })).toHaveAttribute(
      'href',
      '/responsavel/aviso-ativacao/tok-123',
    );
    expect(screen.getByRole('link', { name: /Fazer Login/i })).toHaveAttribute('href', '/login');
  });
});
