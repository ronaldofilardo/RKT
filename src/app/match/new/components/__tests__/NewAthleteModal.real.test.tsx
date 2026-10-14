/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { NewAthleteModal } from '../NewAthleteModal';
import type { Athlete } from '../../types';

function renderModal() {
  return render(
    <NewAthleteModal
      isOpen
      onClose={jest.fn()}
      onCreated={jest.fn((_: Athlete) => undefined)}
    />,
  );
}

function fillAdultBirthDate() {
  const year = new Date().getFullYear() - 25;
  fireEvent.change(screen.getByPlaceholderText('DD'), { target: { value: '01' } });
  fireEvent.change(screen.getByPlaceholderText('MM'), { target: { value: '01' } });
  fireEvent.change(screen.getByPlaceholderText('AAAA'), { target: { value: String(year) } });
  fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'MALE' } });
}

describe('NewAthleteModal — regressões reais', () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('access_token', 'test-token');
    sessionStorage.setItem('user_id', 'user-1');
  });

  it('renderiza as seções Cadastro e Ranking com o subtítulo de autoranking', () => {
    renderModal();

    expect(screen.getByRole('heading', { name: '1. Cadastro' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '2. Ranking' })).toBeInTheDocument();
    expect(screen.getByText('Opções de autoranking')).toBeInTheDocument();
  });

  it('mostra somente categoria e faixa etária no Cadastro para atleta adulto', () => {
    renderModal();
    fillAdultBirthDate();

    expect(screen.getByText('Adulto')).toBeInTheDocument();
    expect(screen.getByText('19–34 anos')).toBeInTheDocument();
    expect(screen.queryByText('Categoria de pertencimento')).not.toBeInTheDocument();
  });

  it('ativa o ranking Estadual e disponibiliza Classe e Posição', () => {
    renderModal();
    fillAdultBirthDate();
    fireEvent.click(screen.getByLabelText('Estadual'));

    expect(screen.getByLabelText('Classe')).toBeInTheDocument();
    expect(screen.getByLabelText('Posição')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remover' })).toBeInTheDocument();
  });

  it('possui container de modal configurado com max-w-xl', () => {
    const { container } = renderModal();
    const modalBox = container.querySelector('.max-w-xl');
    expect(modalBox).toBeInTheDocument();
  });

  it('exibe Posição Ranking Juvenil para atleta juvenil de 17 anos', () => {
    renderModal();
    const year = new Date().getFullYear() - 17;
    fireEvent.change(screen.getByPlaceholderText('DD'), { target: { value: '01' } });
    fireEvent.change(screen.getByPlaceholderText('MM'), { target: { value: '05' } });
    fireEvent.change(screen.getByPlaceholderText('AAAA'), { target: { value: String(year) } });
    fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'MALE' } });

    fireEvent.click(screen.getByLabelText('Estadual'));
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '17-18' } });

    expect(screen.getByLabelText('Posição Ranking Juvenil')).toBeInTheDocument();
    expect(screen.getByLabelText('Posição')).toBeInTheDocument();
    expect(screen.getByLabelText('Categoria')).toBeInTheDocument();
  });
});
