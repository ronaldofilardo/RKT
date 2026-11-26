/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { AthleteMobileCard } from '../athlete-mobile-card';

describe('AthleteMobileCard', () => {
  const athlete = {
    id: 'a1',
    name: 'Rafael Nadal',
    nickname: 'rafa',
    cpf: '12345678900',
    gender: 'MALE',
    birthDate: '1986-06-03',
    origin: 'Mallorca - ES',
    status: 'ACTIVE' as const,
    isMinor: false,
  };

  const actions = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    canDelete: true,
  };

  it('renderiza dados essenciais do atleta no cartão mobile', () => {
    render(<AthleteMobileCard athlete={athlete} actions={actions} showOrigin />);
    expect(screen.getByText('Rafael Nadal')).toBeInTheDocument();
    expect(screen.getByText('@rafa')).toBeInTheDocument();
    expect(screen.getByText('Mallorca - ES')).toBeInTheDocument();
  });

  it('dispara onEdit ao clicar no botão de edição', () => {
    render(<AthleteMobileCard athlete={athlete} actions={actions} />);
    fireEvent.click(screen.getByRole('button', { name: /Editar/i }));
    expect(actions.onEdit).toHaveBeenCalledTimes(1);
  });
});
