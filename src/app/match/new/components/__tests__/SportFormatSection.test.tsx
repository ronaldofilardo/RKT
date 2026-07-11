/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SportFormatSection } from '../SportFormatSection';

describe('SportFormatSection', () => {
  const defaultProps = {
    sportType: 'TENNIS',
    format: 'BEST_OF_3',
    courtType: 'CLAY',
    onSportChange: jest.fn(),
    onFormatChange: jest.fn(),
    onCourtChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar campo Esporte com foco automático', async () => {
    render(<SportFormatSection {...defaultProps} />);
    
    const sportSelect = screen.getAllByRole('combobox')[0];
    
    await waitFor(() => {
      expect(sportSelect).toHaveFocus();
    });
  });

  it('deve renderizar select de Esporte com opções', () => {
    render(<SportFormatSection {...defaultProps} />);
    
    const sportSelect = screen.getAllByRole('combobox')[0];
    
    expect(sportSelect).toHaveValue('TENNIS');
  });

  it('deve chamar onSportChange ao selecionar esporte', () => {
    render(<SportFormatSection {...defaultProps} />);
    
    const sportSelect = screen.getAllByRole('combobox')[0];
    
    fireEvent.change(sportSelect, { target: { value: 'BADMINTON' } });
    
    expect(defaultProps.onSportChange).toHaveBeenCalledWith('BADMINTON');
  });

  it('deve renderizar campo Formato do Jogo', () => {
    render(<SportFormatSection {...defaultProps} />);
    
    const formatSelect = screen.getAllByRole('combobox')[1];
    
    expect(formatSelect).toBeInTheDocument();
    expect(formatSelect).toHaveValue('BEST_OF_3');
  });

  it('deve renderizar campo Tipo de Quadra para TENNIS', () => {
    render(<SportFormatSection {...defaultProps} />);
    
    expect(screen.getByText(/TIPO DE QUADRA/i)).toBeInTheDocument();
  });

  it('não deve renderizar Tipo de Quadra para esportes que não TENNIS', () => {
    render(<SportFormatSection {...defaultProps} sportType="BADMINTON" />);
    
    expect(screen.queryByText(/TIPO DE QUADRA/i)).not.toBeInTheDocument();
  });
});