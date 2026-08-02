/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import NewMatchPage from '../page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/components/Toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('../components', () => ({
  MatchNewHeader: () => <div data-testid="match-new-header">MatchNewHeader</div>,
  SportFormatSection: () => <div data-testid="sport-format-section">SportFormatSection</div>,
  PlayerSelection: () => <div data-testid="player-selection">PlayerSelection</div>,
  DateTimeSection: () => <div data-testid="datetime-section">DateTimeSection</div>,
  MatchDetailsSection: () => <div data-testid="match-details-section">MatchDetailsSection</div>,
  NewAthleteModal: () => <div data-testid="new-athlete-modal">NewAthleteModal</div>,
  ServerSelectionModal: () => <div data-testid="server-selection-modal">ServerSelectionModal</div>,
  DuplicateMatchModal: () => <div data-testid="duplicate-match-modal">DuplicateMatchModal</div>,
  RoundSelector: ({ value, onChange, placeholder }: any) => (
    <div data-testid="round-selector" data-value={value} data-placeholder={placeholder}>
      RoundSelector
    </div>
  ),
}));

describe('NewMatchPage - Categoria e Ordem dos Campos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  describe('Categoria', () => {
    it('deve exibir "Kids" ao invés de "Infantil" na lista de categorias', () => {
      render(<NewMatchPage />);

      const kidsOption = screen.getByRole('option', { name: 'Kids' });
      expect(kidsOption).toBeInTheDocument();
      expect(kidsOption).toHaveAttribute('value', 'INFANTIL');
    });

    it('deve exibir "Infanto-juvenil" ao invés de "Juvenil" na lista de categorias', () => {
      render(<NewMatchPage />);

      const infantoJuvenilOption = screen.getByRole('option', { name: 'Infanto-juvenil' });
      expect(infantoJuvenilOption).toBeInTheDocument();
      expect(infantoJuvenilOption).toHaveAttribute('value', 'JUVENIL');
    });

    it('não deve conter opção com texto "Infantil" ou "Juvenil"', () => {
      render(<NewMatchPage />);

      const options = screen.getAllByRole('option');
      const categoryLabels = ['Infantil', 'Juvenil'];

      categoryLabels.forEach(label => {
        const foundOption = options.find(opt => opt.textContent === label);
        expect(foundOption).toBeUndefined();
      });
    });
  });

  describe('Ordem dos Campos', () => {
    it('deve exibir "Chave" antes de "Fase" no formulário', () => {
      render(<NewMatchPage />);

      const main = screen.getByRole('main');
      const headings = Array.from(main.querySelectorAll('h2'));
      const headingTexts = headings.map(h => h.textContent);

      const chaveIndex = headingTexts.findIndex(t => t?.includes('Chave'));
      const faseIndex = headingTexts.findIndex(t => t?.includes('Fase'));

      expect(chaveIndex).toBeGreaterThan(-1);
      expect(faseIndex).toBeGreaterThan(-1);
      expect(chaveIndex).toBeLessThan(faseIndex);
    });
  });
});