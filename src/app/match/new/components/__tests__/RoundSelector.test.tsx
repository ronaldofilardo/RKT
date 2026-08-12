/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { RoundSelector } from '../RoundSelector';

const ALL_OPTIONS = [
  { value: '1a rodada', label: '1a Rodada' },
  { value: 'oitavas', label: 'Oitavas' },
  { value: 'quartas', label: 'Quartas' },
  { value: 'semifinal', label: 'Semifinal' },
  { value: 'final', label: 'Final' },
];

describe('RoundSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Renderização', () => {
    it('deve renderizar um único elemento select (combobox)', () => {
      render(<RoundSelector value="" onChange={mockOnChange} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('deve renderizar o placeholder padrão quando nenhum placeholder for fornecido', () => {
      render(<RoundSelector value="" onChange={mockOnChange} />);

      expect(screen.getByText('Selecione a rodada')).toBeInTheDocument();
    });

    it('deve renderizar o placeholder personalizado quando fornecido', () => {
      render(<RoundSelector value="" onChange={mockOnChange} placeholder="Fase da partida" />);

      expect(screen.getByText('Fase da partida')).toBeInTheDocument();
      expect(screen.queryByText('Selecione a rodada')).not.toBeInTheDocument();
    });

    it('deve renderizar exatamente as 5 opções padrão (sem "Outras")', () => {
      render(<RoundSelector value="" onChange={mockOnChange} />);

      expect(screen.getByText('1a Rodada')).toBeInTheDocument();
      expect(screen.getByText('Oitavas')).toBeInTheDocument();
      expect(screen.getByText('Quartas')).toBeInTheDocument();
      expect(screen.getByText('Semifinal')).toBeInTheDocument();
      expect(screen.getByText('Final')).toBeInTheDocument();
    });

    it('NÃO deve renderizar a opção "Outras"', () => {
      render(<RoundSelector value="" onChange={mockOnChange} />);

      expect(screen.queryByText('Outras')).not.toBeInTheDocument();
    });

    it('NÃO deve renderizar o option com value="outras"', () => {
      render(<RoundSelector value="" onChange={mockOnChange} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      const values = Array.from(select.options).map((o) => o.value);
      expect(values).not.toContain('outras');
    });

    it('total de options = 1 placeholder + 5 opções = 6', () => {
      render(<RoundSelector value="" onChange={mockOnChange} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.options.length).toBe(6);
    });
  });

  describe('Controle de valor', () => {
    it('deve refletir o valor recebido via prop "value"', () => {
      render(<RoundSelector value="quartas" onChange={mockOnChange} />);

      expect(screen.getByRole('combobox')).toHaveValue('quartas');
    });

    it('deve refletir string vazia quando value="" (placeholder selecionado)', () => {
      render(<RoundSelector value="" onChange={mockOnChange} />);

      expect(screen.getByRole('combobox')).toHaveValue('');
    });

    it('deve atualizar o valor exibido quando a prop "value" mudar', () => {
      const { rerender } = render(<RoundSelector value="" onChange={mockOnChange} />);

      expect(screen.getByRole('combobox')).toHaveValue('');

      rerender(<RoundSelector value="final" onChange={mockOnChange} />);
      expect(screen.getByRole('combobox')).toHaveValue('final');
    });
  });

  describe('onChange', () => {
    it('deve chamar onChange exatamente uma vez ao selecionar uma opção', () => {
      render(<RoundSelector value="" onChange={mockOnChange} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: '1a rodada' } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it.each(ALL_OPTIONS.map((o) => [o.label, o.value]))(
      'deve chamar onChange com "%s" (value=%s) ao selecionar essa opção',
      (_label, value) => {
        render(<RoundSelector value="" onChange={mockOnChange} />);

        fireEvent.change(screen.getByRole('combobox'), { target: { value } });

        expect(mockOnChange).toHaveBeenCalledWith(value);
      },
    );

    it('deve chamar onChange com "" ao selecionar o placeholder (voltar para vazio)', () => {
      render(<RoundSelector value="oitavas" onChange={mockOnChange} />);

      fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });

      expect(mockOnChange).toHaveBeenCalledWith('');
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Comportamento legado removido (regressão)', () => {
    it('NÃO deve renderizar campo de texto (input) para customização', () => {
      render(<RoundSelector value="" onChange={mockOnChange} />);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('NÃO deve renderizar input mesmo quando value for um valor não-padrão', () => {
      render(<RoundSelector value="Valor Inexistente" onChange={mockOnChange} />);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Digite o nome da rodada')).not.toBeInTheDocument();
    });

    it('NÃO deve chamar onChange com "" ao receber um valor fora das opções (não há modo "Outras")', () => {
      render(<RoundSelector value="" onChange={mockOnChange} />);

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'final' } });

      expect(mockOnChange).toHaveBeenCalledWith('final');
      expect(mockOnChange).not.toHaveBeenCalledWith('');
    });

    it('não deve manter estado interno entre renders (componente sem estado)', () => {
      const { rerender } = render(<RoundSelector value="oitavas" onChange={mockOnChange} />);

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'final' } });
      expect(mockOnChange).toHaveBeenLastCalledWith('final');

      rerender(<RoundSelector value="quartas" onChange={mockOnChange} />);
      expect(screen.getByRole('combobox')).toHaveValue('quartas');
    });
  });

  describe('Acessibilidade / atributos', () => {
    it('select deve ter classes de estilo esperadas', () => {
      render(<RoundSelector value="" onChange={mockOnChange} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('w-full');
      expect(select).toHaveClass('border');
      expect(select).toHaveClass('rounded-lg');
    });

    it('todos os options devem ter classes de texto escuro', () => {
      render(<RoundSelector value="" onChange={mockOnChange} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      const textOptions = Array.from(select.options).filter((o) => o.textContent !== '');
      expect(textOptions.length).toBeGreaterThan(0);
      textOptions.forEach((opt) => {
        expect(opt).toHaveClass('text-gray-900');
      });
    });
  });
});
