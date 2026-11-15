/**
 * @jest-environment jsdom
 */
// Divisão de NewAthleteModal.characterization.test.tsx (381L) — categorias.
// Kit compartilhado: newAthleteModalTestKit.tsx.
import { fireEvent, screen } from '@testing-library/react';
import { fillBirthDateForAge, installFetchMock, seedSessionStorage, setupModal } from './newAthleteModalTestKit';

const mockFetch = installFetchMock();

describe('NewAthleteModal — categorias por ranking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    seedSessionStorage();
    setupModal();
    fillBirthDateForAge(14);
    fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'MALE' } });
  });

  it('resets class when category changes', () => {
    fireEvent.click(screen.getByLabelText('Estadual'));
    const categorySelect = screen.getByLabelText('Categoria');
    fireEvent.change(categorySelect, { target: { value: '13-14' } });
    const classSelect = screen.getByLabelText('Classe');
    fireEvent.change(classSelect, { target: { value: '1ªMA' } });
    fireEvent.change(categorySelect, { target: { value: '15-16' } });
    expect(classSelect).toHaveValue('');
  });

  it('shows juvenile position only for youth categories', () => {
    fireEvent.click(screen.getByLabelText('Estadual'));
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '13-14' } });
    expect(screen.getByLabelText('Posição Ranking Juvenil')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '35-39' } });
    expect(screen.queryByLabelText('Posição Ranking Juvenil')).not.toBeInTheDocument();
  });

  it('COSAT uses turning age (birth year) for category', () => {
    fireEvent.click(screen.getByLabelText('COSAT'));
    const categorySelect = screen.getByLabelText('Categoria');
    fireEvent.click(categorySelect);
    const options = screen.getAllByRole('option').map((o) => o.textContent).filter((t) => t?.includes('anos'));
    expect(options).toContain('13-14 anos');
    expect(options).toContain('15-16 anos');
  });

  it('ITF_Juniors does not show a category', () => {
    fireEvent.click(screen.getByLabelText('ITF Juniors'));
    expect(screen.queryByLabelText('Categoria')).not.toBeInTheDocument();
  });

  it('ITF shows veteran categories for age >= 35', () => {
    setupModal();
    fillBirthDateForAge(50);
    fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'MALE' } });
    fireEvent.click(screen.getByLabelText('ITF'));
    const categorySelect = screen.getByLabelText('Categoria');
    fireEvent.click(categorySelect);
    const options = screen.getAllByRole('option').map((o) => o.textContent).filter((t) => t?.includes('anos'));
    // A categoria-base é 50-54; o veterano pode se autoenquadrar também na faixa imediatamente inferior.
    expect(options).toContain('50-54 anos');
    expect(options).toContain('45-49 anos');
  });
});
