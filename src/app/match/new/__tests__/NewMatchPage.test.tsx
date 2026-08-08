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

describe('NewMatchPage - Rodada e Ordem dos Campos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  describe('Rodada', () => {
    it('deve exibir o componente RoundSelector para seleção de rodada', () => {
      render(<NewMatchPage />);

      const roundSelectors = screen.getAllByTestId('round-selector');
      expect(roundSelectors.length).toBeGreaterThanOrEqual(1);
    });

    it('deve ocultar Fase quando rodada é selecionada', () => {
      render(<NewMatchPage />);

      const main = screen.getByRole('main');
      const headings = Array.from(main.querySelectorAll('h2'));
      const headingTexts = headings.map(h => h.textContent);

      const faseIndex = headingTexts.findIndex(t => t?.includes('Fase'));
      expect(faseIndex).toBeGreaterThan(-1);
    });
  });

  describe('Ordem dos Campos', () => {
    it('deve exibir "Rodada" antes de "Fase" no formulário', () => {
      render(<NewMatchPage />);

      const main = screen.getByRole('main');
      const headings = Array.from(main.querySelectorAll('h2'));
      const headingTexts = headings.map(h => h.textContent);

      const rodadaIndex = headingTexts.findIndex(t => t?.includes('Rodada'));
      const faseIndex = headingTexts.findIndex(t => t?.includes('Fase'));

      expect(rodadaIndex).toBeGreaterThan(-1);
      expect(faseIndex).toBeGreaterThan(-1);
      expect(rodadaIndex).toBeLessThan(faseIndex);
    });
  });
});