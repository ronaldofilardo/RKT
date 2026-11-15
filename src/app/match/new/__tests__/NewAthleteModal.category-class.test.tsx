/**
 * @jest-environment jsdom
 */
// Divisão de NewAthleteModal.characterization.test.tsx (381L) — categoria/classe.
// Kit compartilhado: newAthleteModalTestKit.tsx.
import { fireEvent, screen } from '@testing-library/react';
import { fillBirthDateForAge, installFetchMock, seedSessionStorage, setupModal } from './newAthleteModalTestKit';

const mockFetch = installFetchMock();

describe('NewAthleteModal — lógica de categoria e classe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    seedSessionStorage();
    setupModal();
    fillBirthDateForAge(14);
    fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'MALE' } });
  });

  it('shows category select when ranking enabled and has categories', () => {
    fireEvent.click(screen.getByLabelText('Estadual'));
    expect(screen.getByLabelText('Categoria')).toBeInTheDocument();
  });

  it('shows allowed categories for age in ESTADUAL (natural + higher)', () => {
    fireEvent.click(screen.getByLabelText('Estadual'));
    const categorySelect = screen.getByLabelText('Categoria');
    fireEvent.click(categorySelect);
    const options = screen.getAllByRole('option').map((o) => o.textContent).filter((t) => t?.includes('anos'));
    // For age 14: 13-14, 15-16, 17-18
    expect(options).toContain('13-14 anos');
    expect(options).toContain('15-16 anos');
  });

  it('shows class select for ESTADUAL when gender and age provided', () => {
    fireEvent.click(screen.getByLabelText('Estadual'));
    expect(screen.getByLabelText('Classe')).toBeInTheDocument();
  });

  it('disables class select when age < 11', () => {
    setupModal();
    fillBirthDateForAge(10);
    fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'MALE' } });
    fireEvent.click(screen.getByLabelText('Estadual'));
    expect(screen.getByLabelText('Classe')).toBeDisabled();
  });
});
