/**
 * @jest-environment jsdom
 */
// Divisão de NewAthleteModal.characterization.test.tsx (381L) — toggle ranking.
// Kit compartilhado: newAthleteModalTestKit.tsx.
import { fireEvent, screen } from '@testing-library/react';
import { fillBirthDateForAge, installFetchMock, seedSessionStorage, setupModal } from './newAthleteModalTestKit';

const mockFetch = installFetchMock();

describe('NewAthleteModal — toggle de ranking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    seedSessionStorage();
    setupModal();
    fillBirthDateForAge(14);
    fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'MALE' } });
  });

  it('enables ranking and shows fields on checkbox click', () => {
    const estadualCheckbox = screen.getByLabelText('Estadual');
    expect(estadualCheckbox).not.toBeChecked();
    fireEvent.click(estadualCheckbox);
    expect(estadualCheckbox).toBeChecked();
    expect(screen.getByLabelText('Categoria')).toBeInTheDocument();
    expect(screen.getByLabelText('Posição')).toBeInTheDocument();
  });

  it('disables ranking and clears all fields on uncheck', () => {
    const estadualCheckbox = screen.getByLabelText('Estadual');
    fireEvent.click(estadualCheckbox);
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '13-14' } });
    fireEvent.change(screen.getByLabelText('Classe'), { target: { value: '1ªMA' } });
    fireEvent.change(screen.getByLabelText('Posição'), { target: { value: '5' } });
    fireEvent.click(estadualCheckbox);
    expect(screen.queryByLabelText('Categoria')).not.toBeInTheDocument();
    fireEvent.click(estadualCheckbox);
    expect(screen.getByLabelText('Categoria')).toHaveValue('');
  });

  it('shows Remove button when ranking enabled', () => {
    fireEvent.click(screen.getByLabelText('Estadual'));
    expect(screen.getByText('Remover')).toBeInTheDocument();
  });

  it('Remove button disables ranking and clears fields', () => {
    const estadualCheckbox = screen.getByLabelText('Estadual');
    fireEvent.click(estadualCheckbox);
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '13-14' } });
    fireEvent.click(screen.getByText('Remover'));
    expect(estadualCheckbox).not.toBeChecked();
    expect(screen.queryByLabelText('Categoria')).not.toBeInTheDocument();
  });
});
