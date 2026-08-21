/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewAthleteModal } from '../components/NewAthleteModal';
import type { Athlete } from '../types';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function setupModal(overrides: Partial<{ isOpen: boolean; onClose: () => void; onCreated: (a: Athlete) => void }> = {}) {
  return render(
    <NewAthleteModal
      isOpen={overrides.isOpen ?? true}
      onClose={overrides.onClose ?? jest.fn()}
      onCreated={overrides.onCreated ?? jest.fn()}
    />
  );
}

describe('NewAthleteModal — Characterization Tests', () => {
  const mockOnClose = jest.fn();
  const mockOnCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
    sessionStorage.clear();
    sessionStorage.setItem('access_token', 'test-token');
    sessionStorage.setItem('user_id', 'user-1');
  });

  describe('Initial render', () => {
    it('renders nothing when isOpen is false', () => {
      const { queryByText } = setupModal({ isOpen: false });
      expect(queryByText('Novo Atleta')).not.toBeInTheDocument();
    });

    it('renders modal with title when isOpen is true', () => {
      setupModal();
      expect(screen.getByText('Novo Atleta')).toBeInTheDocument();
      expect(screen.getByText('Preencha os dados do jogador')).toBeInTheDocument();
    });

    it('shows Cancel and Save buttons', () => {
      setupModal();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Salvar Atleta' })).toBeInTheDocument();
    });
  });

  describe('Form validation & basic fields', () => {
    it('Save button disabled when name is empty', () => {
      setupModal();
      expect(screen.getByRole('button', { name: 'Salvar Atleta' })).toBeDisabled();
    });

    it('Save button enabled when name is filled', () => {
      setupModal();
      fireEvent.change(screen.getByPlaceholderText('Ex: João Silva'), { target: { value: 'João' } });
      expect(screen.getByRole('button', { name: 'Salvar Atleta' })).not.toBeDisabled();
    });

    it('renders gender select with options', () => {
      setupModal();
      const genderSelect = screen.getByLabelText('Sexo');
      expect(genderSelect).toBeInTheDocument();
      expect(genderSelect).toHaveValue('');
      fireEvent.change(genderSelect, { target: { value: 'MALE' } });
      expect(genderSelect).toHaveValue('MALE');
    });

    it('renders birth date inputs (DD/MM/AAAA)', () => {
      setupModal();
      const dayInputs = screen.getAllByPlaceholderText('DD');
      const monthInputs = screen.getAllByPlaceholderText('MM');
      const yearInputs = screen.getAllByPlaceholderText('AAAA');
      expect(dayInputs.length).toBeGreaterThan(0);
      expect(monthInputs.length).toBeGreaterThan(0);
      expect(yearInputs.length).toBeGreaterThan(0);
    });

    it('calculates age correctly from valid birth date', () => {
      setupModal();
      const currentYear = new Date().getFullYear();
      fireEvent.change(screen.getAllByPlaceholderText('DD')[0], { target: { value: '15' } });
      fireEvent.change(screen.getAllByPlaceholderText('MM')[0], { target: { value: '03' } });
      fireEvent.change(screen.getAllByPlaceholderText('AAAA')[0], { target: { value: String(currentYear - 20) } });
      expect(screen.getByText('Idade: 20 anos')).toBeInTheDocument();
    });

    it('renders dominance select', () => {
      setupModal();
      expect(screen.getByLabelText('Dominância')).toBeInTheDocument();
    });

    it('renders backhand select', () => {
      setupModal();
      expect(screen.getByLabelText('Backhand')).toBeInTheDocument();
    });
  });

  describe('Available ranking types by age', () => {
    it('shows all 7 ranking types when no age', () => {
      setupModal();
      const rankingRows = screen.getAllByRole('checkbox');
      expect(rankingRows).toHaveLength(7);
    });

    it('filters out ATP/WTA for age > 40', () => {
      setupModal();
      const currentYear = new Date().getFullYear();
      fireEvent.change(screen.getAllByPlaceholderText('DD')[0], { target: { value: '15' } });
      fireEvent.change(screen.getAllByPlaceholderText('MM')[0], { target: { value: '03' } });
      fireEvent.change(screen.getAllByPlaceholderText('AAAA')[0], { target: { value: String(currentYear - 45) } });
      const checkboxes = screen.getAllByRole('checkbox');
      const labels = checkboxes.map(c => c.closest('label')?.textContent || '');
      expect(labels).not.toContain('ATP');
      expect(labels).not.toContain('WTA');
    });

    it('filters out ITF_Juniors for age < 14', () => {
      setupModal();
      const currentYear = new Date().getFullYear();
      fireEvent.change(screen.getAllByPlaceholderText('DD')[0], { target: { value: '15' } });
      fireEvent.change(screen.getAllByPlaceholderText('MM')[0], { target: { value: '03' } });
      fireEvent.change(screen.getAllByPlaceholderText('AAAA')[0], { target: { value: String(currentYear - 12) } });
      const checkboxes = screen.getAllByRole('checkbox');
      const labels = checkboxes.map(c => c.closest('label')?.textContent || '');
      expect(labels).not.toContain('ITF Juniors');
    });
  });

  describe('Category & Class logic', () => {
    let currentYear: number;

    beforeEach(() => {
      currentYear = new Date().getFullYear();
      setupModal();
      fireEvent.change(screen.getAllByPlaceholderText('DD')[0], { target: { value: '15' } });
      fireEvent.change(screen.getAllByPlaceholderText('MM')[0], { target: { value: '03' } });
      fireEvent.change(screen.getAllByPlaceholderText('AAAA')[0], { target: { value: String(currentYear - 14) } });
      fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'MALE' } });
    });

    it('shows category select when ranking enabled and has categories', () => {
      const estadualCheckbox = screen.getByLabelText('Estadual');
      fireEvent.click(estadualCheckbox);
      expect(screen.getByLabelText('Categoria')).toBeInTheDocument();
    });

    it('shows allowed categories for age in ESTADUAL (natural + higher)', () => {
      const estadualCheckbox = screen.getByLabelText('Estadual');
      fireEvent.click(estadualCheckbox);
      const categorySelect = screen.getByLabelText('Categoria');
      fireEvent.click(categorySelect);
      const options = screen.getAllByRole('option').map(o => o.textContent).filter(t => t?.includes('anos'));
      // For age 14: 13-14, 15-16, 17-18
      expect(options).toContain('13-14 anos');
      expect(options).toContain('15-16 anos');
    });

    it('shows class select for ESTADUAL when gender and age provided', () => {
      const estadualCheckbox = screen.getByLabelText('Estadual');
      fireEvent.click(estadualCheckbox);
      expect(screen.getByLabelText('Classe')).toBeInTheDocument();
    });

    it('disables class select when age < 11', () => {
      const { rerender } = render(
        <NewAthleteModal isOpen={true} onClose={mockOnClose} onCreated={mockOnCreated} />
      );
      fireEvent.change(screen.getAllByPlaceholderText('DD')[0], { target: { value: '15' } });
      fireEvent.change(screen.getAllByPlaceholderText('MM')[0], { target: { value: '03' } });
      fireEvent.change(screen.getAllByPlaceholderText('AAAA')[0], { target: { value: String(currentYear - 10) } });
      fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'MALE' } });
      const estadualCheckbox = screen.getByLabelText('Estadual');
      fireEvent.click(estadualCheckbox);
      const classSelect = screen.getByLabelText('Classe');
      expect(classSelect).toBeDisabled();
    });

    it('resets class when category changes', () => {
      const estadualCheckbox = screen.getByLabelText('Estadual');
      fireEvent.click(estadualCheckbox);
      const categorySelect = screen.getByLabelText('Categoria');
      fireEvent.change(categorySelect, { target: { value: '13-14' } });
      const classSelect = screen.getByLabelText('Classe');
      fireEvent.change(classSelect, { target: { value: '1ªMA' } });
      fireEvent.change(categorySelect, { target: { value: '15-16' } });
      expect(classSelect).toHaveValue('');
    });

    it('shows juvenile position only for youth categories', () => {
      const estadualCheckbox = screen.getByLabelText('Estadual');
      fireEvent.click(estadualCheckbox);
      fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '13-14' } });
      expect(screen.getByLabelText('Posição Ranking Juvenil')).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '35-39' } });
      expect(screen.queryByLabelText('Posição Ranking Juvenil')).not.toBeInTheDocument();
    });

    it('COSAT uses turning age (birth year) for category', () => {
      const cosatCheckbox = screen.getByLabelText('COSAT');
      fireEvent.click(cosatCheckbox);
      const categorySelect = screen.getByLabelText('Categoria');
      fireEvent.click(categorySelect);
      const options = screen.getAllByRole('option').map(o => o.textContent).filter(t => t?.includes('anos'));
      expect(options).toContain('13-14 anos');
      expect(options).toContain('15-16 anos');
    });

    it('ITF_Juniors only shows 18 category', () => {
      const itfJuniorsCheckbox = screen.getByLabelText('ITF Juniors');
      fireEvent.click(itfJuniorsCheckbox);
      const categorySelect = screen.getByLabelText('Categoria');
      fireEvent.click(categorySelect);
      const options = screen.getAllByRole('option').map(o => o.textContent).filter(t => t?.includes('anos'));
      expect(options).toContain('18 anos');
    });

    it('ITF shows veteran categories for age >= 35', () => {
      const { rerender } = render(
        <NewAthleteModal isOpen={true} onClose={mockOnClose} onCreated={mockOnCreated} />
      );
      fireEvent.change(screen.getAllByPlaceholderText('DD')[0], { target: { value: '15' } });
      fireEvent.change(screen.getAllByPlaceholderText('MM')[0], { target: { value: '03' } });
      fireEvent.change(screen.getAllByPlaceholderText('AAAA')[0], { target: { value: String(currentYear - 50) } });
      fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'MALE' } });
      const itfCheckbox = screen.getByLabelText('ITF');
      fireEvent.click(itfCheckbox);
      const categorySelect = screen.getByLabelText('Categoria');
      fireEvent.click(categorySelect);
      const options = screen.getAllByRole('option').map(o => o.textContent).filter(t => t?.includes('anos'));
      // For age 50, only 50-54 is available (no higher mapping for adult categories)
      expect(options).toContain('50-54 anos');
    });
  });

  describe('Ranking toggle behavior', () => {
    let currentYear: number;

    beforeEach(() => {
      currentYear = new Date().getFullYear();
      setupModal();
      fireEvent.change(screen.getAllByPlaceholderText('DD')[0], { target: { value: '15' } });
      fireEvent.change(screen.getAllByPlaceholderText('MM')[0], { target: { value: '03' } });
      fireEvent.change(screen.getAllByPlaceholderText('AAAA')[0], { target: { value: String(currentYear - 14) } });
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
      const estadualCheckbox = screen.getByLabelText('Estadual');
      fireEvent.click(estadualCheckbox);
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

  describe('Form submission', () => {
    let currentYear: number;

    beforeEach(() => {
      currentYear = new Date().getFullYear();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { id: 'p1', name: 'João Silva', gender: 'MALE', age: 20 } }),
      });
    });

    it('calls API with correct payload on submit', async () => {
      setupModal();
      fireEvent.change(screen.getByPlaceholderText('Ex: João Silva'), { target: { value: 'João Silva' } });
      fireEvent.change(screen.getAllByPlaceholderText('DD')[0], { target: { value: '15' } });
      fireEvent.change(screen.getAllByPlaceholderText('MM')[0], { target: { value: '03' } });
      fireEvent.change(screen.getAllByPlaceholderText('AAAA')[0], { target: { value: String(currentYear - 20) } });
      fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'MALE' } });

      fireEvent.click(screen.getByRole('button', { name: 'Salvar Atleta' }));
      await waitFor(() => expect(mockFetch).toHaveBeenCalled());

      const call = mockFetch.mock.calls[0];
      expect(call[0]).toBe('/api/players');
      const body = JSON.parse(call[1].body);
      expect(body.name).toBe('João Silva');
      expect(body.gender).toBe('MALE');
    });

    it('shows error message on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Nome já cadastrado' }),
      });

      setupModal();
      fireEvent.change(screen.getByPlaceholderText('Ex: João Silva'), { target: { value: 'João Silva' } });
      fireEvent.change(screen.getAllByPlaceholderText('DD')[0], { target: { value: '15' } });
      fireEvent.change(screen.getAllByPlaceholderText('MM')[0], { target: { value: '03' } });
      fireEvent.change(screen.getAllByPlaceholderText('AAAA')[0], { target: { value: String(currentYear - 20) } });
      fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'MALE' } });

      fireEvent.click(screen.getByRole('button', { name: 'Salvar Atleta' }));
      await waitFor(() => {
        expect(screen.getByText('Nome já cadastrado')).toBeInTheDocument();
      });
    });

    it('shows error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      setupModal();
      fireEvent.change(screen.getByPlaceholderText('Ex: João Silva'), { target: { value: 'João Silva' } });
      fireEvent.change(screen.getAllByPlaceholderText('DD')[0], { target: { value: '15' } });
      fireEvent.change(screen.getAllByPlaceholderText('MM')[0], { target: { value: '03' } });
      fireEvent.change(screen.getAllByPlaceholderText('AAAA')[0], { target: { value: String(currentYear - 20) } });
      fireEvent.change(screen.getByLabelText('Sexo'), { target: { value: 'MALE' } });

      fireEvent.click(screen.getByRole('button', { name: 'Salvar Atleta' }));
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('does not submit if name is empty', () => {
      setupModal();
      fireEvent.click(screen.getByRole('button', { name: 'Salvar Atleta' }));
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all inputs', () => {
      setupModal();
      expect(screen.getByPlaceholderText('Ex: João Silva')).toBeInTheDocument();
      expect(screen.getByLabelText('Sexo')).toBeInTheDocument();
      expect(screen.getByLabelText('Dia')).toBeInTheDocument();
      expect(screen.getByLabelText('Mês')).toBeInTheDocument();
      expect(screen.getByLabelText('Ano')).toBeInTheDocument();
      expect(screen.getByLabelText('Dominância')).toBeInTheDocument();
      expect(screen.getByLabelText('Backhand')).toBeInTheDocument();
    });

    it('modal has proper role attributes', () => {
      setupModal();
      expect(screen.getByLabelText('Fechar modal')).toHaveAttribute('role', 'button');
    });
  });
});