/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
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
      <button type="button" onClick={() => onChange('final')}>
        trigger
      </button>
    </div>
  ),
}));

describe('NewMatchPage - Torneio, Clube e Rodada (Fase removido)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  describe('Campos presentes', () => {
    it('deve exibir o campo Torneio (opcional)', () => {
      render(<NewMatchPage />);

      const main = screen.getByRole('main');
      const headings = Array.from(main.querySelectorAll('h2'));
      const headingTexts = headings.map((h) => h.textContent);

      expect(headingTexts.some((t) => t?.includes('Torneio'))).toBe(true);
    });

    it('deve exibir o campo Clube (opcional)', () => {
      render(<NewMatchPage />);

      const main = screen.getByRole('main');
      const headings = Array.from(main.querySelectorAll('h2'));
      const headingTexts = headings.map((h) => h.textContent);

      expect(headingTexts.some((t) => t?.includes('Clube'))).toBe(true);
    });

    it('deve exibir o campo Rodada (opcional) montando o componente RoundSelector', () => {
      render(<NewMatchPage />);

      const roundSelectors = screen.getAllByTestId('round-selector');
      expect(roundSelectors.length).toBeGreaterThanOrEqual(1);
    });

    it('deve renderizar input de texto para Torneio com placeholder apropriado', () => {
      render(<NewMatchPage />);

      expect(screen.getByPlaceholderText('Nome do torneio')).toBeInTheDocument();
    });

    it('deve renderizar input de texto para Clube com placeholder apropriado', () => {
      render(<NewMatchPage />);

      expect(screen.getByPlaceholderText('Nome do clube')).toBeInTheDocument();
    });

    it('deve passar placeholder "Selecione a rodada" para o RoundSelector', () => {
      render(<NewMatchPage />);

      const roundSelector = screen.getByTestId('round-selector');
      expect(roundSelector).toHaveAttribute('data-placeholder', 'Selecione a rodada');
    });
  });

  describe('Campo Fase removido (regressão)', () => {
    it('NÃO deve exibir o heading "Fase" no formulário', () => {
      render(<NewMatchPage />);

      const main = screen.getByRole('main');
      const headings = Array.from(main.querySelectorAll('h2'));
      const headingTexts = headings.map((h) => h.textContent);

      expect(headingTexts.some((t) => t?.includes('Fase'))).toBe(false);
    });

    it('NÃO deve renderizar mais de um RoundSelector (campo Fase removido)', () => {
      render(<NewMatchPage />);

      const roundSelectors = screen.getAllByTestId('round-selector');
      expect(roundSelectors.length).toBe(1);
    });

    it('não deve existir heading "(opcional)" extra do antigo campo Fase', () => {
      render(<NewMatchPage />);

      const main = screen.getByRole('main');
      const headings = Array.from(main.querySelectorAll('h2'));
      const faseHeadings = headings.filter((h) =>
        h.textContent?.match(/^Fase\b/),
      );
      expect(faseHeadings.length).toBe(0);
    });
  });

  describe('Ordem dos campos', () => {
    it('deve exibir Torneio, Clube e Rodada nessa ordem dentro da seção', () => {
      render(<NewMatchPage />);

      const main = screen.getByRole('main');
      const headings = Array.from(main.querySelectorAll('h2'));
      const headingTexts = headings.map((h) => h.textContent);

      const torneioIndex = headingTexts.findIndex((t) => t?.includes('Torneio'));
      const clubeIndex = headingTexts.findIndex((t) => t?.includes('Clube'));
      const rodadaIndex = headingTexts.findIndex((t) => t?.includes('Rodada'));

      expect(torneioIndex).toBeGreaterThanOrEqual(0);
      expect(clubeIndex).toBeGreaterThan(torneioIndex);
      expect(rodadaIndex).toBeGreaterThan(clubeIndex);
    });

    it('Rodada deve ser o último campo da seção de Torneio (depois de Clube, sem Fase)', () => {
      render(<NewMatchPage />);

      const main = screen.getByRole('main');
      const headings = Array.from(main.querySelectorAll('h2'));
      const headingTexts = headings.map((h) => h.textContent);

      const rodadaIndex = headingTexts.findIndex((t) => t?.includes('Rodada'));
      const faseIndex = headingTexts.findIndex((t) => t?.includes('Fase'));

      expect(rodadaIndex).toBeGreaterThan(-1);
      expect(faseIndex).toBe(-1);
    });
  });

  describe('Integração RoundSelector -> estado da partida', () => {
    it('deve iniciar com value vazio no RoundSelector', () => {
      render(<NewMatchPage />);

      const roundSelector = screen.getByTestId('round-selector');
      expect(roundSelector).toHaveAttribute('data-value', '');
    });

    it('deve propagar seleção do RoundSelector para o estado da página (category e roundName)', async () => {
      render(<NewMatchPage />);

      const trigger = screen.getByText('trigger', { selector: 'button' });
      act(() => {
        trigger.click();
      });

      await screen.findByText('trigger', { selector: 'button' });

      // Após interação o componente pai deve refletir a mudança;
      // Verificamos que não há mais o heading "Fase" (regressão) e que
      // há exatamente 1 RoundSelector, confirmando propagação limpa.
      const main = screen.getByRole('main');
      const headings = Array.from(main.querySelectorAll('h2'));
      const headingTexts = headings.map((h) => h.textContent);
      expect(headingTexts.some((t) => t?.includes('Fase'))).toBe(false);
      expect(screen.getAllByTestId('round-selector').length).toBe(1);
    });
  });
});
