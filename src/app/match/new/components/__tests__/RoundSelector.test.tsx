/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { RoundSelector } from '../RoundSelector';

describe('RoundSelector', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('deve renderizar o dropdown com as opções padrão', () => {
    render(<RoundSelector value="" onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    
    expect(screen.getByText('Selecione a rodada')).toBeInTheDocument();
    expect(screen.getByText('Abertura')).toBeInTheDocument();
    expect(screen.getByText('Oitavas')).toBeInTheDocument();
    expect(screen.getByText('Quartas')).toBeInTheDocument();
    expect(screen.getByText('Semifinal')).toBeInTheDocument();
    expect(screen.getByText('Final')).toBeInTheDocument();
    expect(screen.getByText('Outras')).toBeInTheDocument();
  });

  it('deve chamar onChange com o valor selecionado do dropdown', () => {
    render(<RoundSelector value="" onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'abertura' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('abertura');
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('deve mostrar o campo de texto quando "Outras" for selecionado', () => {
    render(<RoundSelector value="" onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'outras' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('');
    
    const input = screen.getByPlaceholderText('Digite o nome da rodada');
    expect(input).toBeInTheDocument();
  });

  it('deve permitir digitar múltiplos caracteres no campo "Outras"', () => {
    render(<RoundSelector value="outras" onChange={mockOnChange} />);
    
    const input = screen.getByPlaceholderText('Digite o nome da rodada');
    
    fireEvent.change(input, { target: { value: 'F' } });
    expect(mockOnChange).toHaveBeenCalledWith('F');
    
    fireEvent.change(input, { target: { value: 'Fi' } });
    expect(mockOnChange).toHaveBeenCalledWith('Fi');
    
    fireEvent.change(input, { target: { value: 'Fina' } });
    expect(mockOnChange).toHaveBeenCalledWith('Fina');
    
    fireEvent.change(input, { target: { value: 'Final Regional' } });
    expect(mockOnChange).toHaveBeenCalledWith('Final Regional');
  });

  it('deve atualizar o campo de texto quando o valor externo mudar para um valor personalizado', () => {
    const { rerender } = render(<RoundSelector value="Campeonato Local" onChange={mockOnChange} />);
    
    expect(screen.getByRole('combobox')).toHaveValue('outras');
    expect(screen.getByPlaceholderText('Digite o nome da rodada')).toHaveValue('Campeonato Local');
    
    rerender(<RoundSelector value="Novo Valor" onChange={mockOnChange} />);
    
    expect(screen.getByPlaceholderText('Digite o nome da rodada')).toHaveValue('Novo Valor');
  });

  it('deve esconder o campo de texto ao selecionar uma opção padrão após "Outras"', () => {
    const { rerender } = render(<RoundSelector value="outras" onChange={mockOnChange} />);
    
    expect(screen.getByPlaceholderText('Digite o nome da rodada')).toBeInTheDocument();
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'quartas' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('quartas');
    
    rerender(<RoundSelector value="quartas" onChange={mockOnChange} />);
    
    expect(screen.queryByPlaceholderText('Digite o nome da rodada')).not.toBeInTheDocument();
  });

  it('deve usar o placeholder personalizado quando fornecido', () => {
    render(<RoundSelector value="" onChange={mockOnChange} placeholder="Custom placeholder" />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'outras' } });
    
    const input = screen.getByPlaceholderText('Custom placeholder');
    expect(input).toBeInTheDocument();
  });

  it('deve mostrar o campo de texto quando "Outras" for selecionado (sem foco automático)', () => {
    render(<RoundSelector value="" onChange={mockOnChange} />);
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'outras' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('');
    
    const input = screen.getByPlaceholderText('Digite o nome da rodada');
    expect(input).toBeInTheDocument();
    expect(document.activeElement).not.toBe(input);
  });

  it('deve limpar o input interno ao mudar de "Outras" para opção padrão', () => {
    render(<RoundSelector value="Texto Personalizado" onChange={mockOnChange} />);
    
    expect(screen.getByPlaceholderText('Digite o nome da rodada')).toHaveValue('Texto Personalizado');
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'semifinal' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('semifinal');
  });
});