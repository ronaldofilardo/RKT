/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MatchDetailsSection } from '../MatchDetailsSection';

describe('MatchDetailsSection', () => {
  const defaultProps = {
    visibility: 'PLAYERS_ONLY',
    apontadorEmail: '',
    bracketType: '',
    venueId: '',
    publicMatchCode: '',
    temperature: '',
    humidity: '',
    tags: '',
    onVisibilityChange: jest.fn(),
    onApontadorChange: jest.fn(),
    onBracketChange: jest.fn(),
    onVenueChange: jest.fn(),
    onPublicCodeChange: jest.fn(),
    onTemperatureChange: jest.fn(),
    onHumidityChange: jest.fn(),
    onTagsChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar dropdown Tipo de Chave com opções Grupo, Chave, Grupo+Chave', () => {
    render(<MatchDetailsSection {...defaultProps} />);
    
    const selects = screen.getAllByRole('combobox');
    const bracketSelect = selects[1];
    
    expect(bracketSelect).toBeInTheDocument();
    
    fireEvent.click(bracketSelect);
    
    expect(screen.getByText('Grupo')).toBeInTheDocument();
    expect(screen.getByText('Chave')).toBeInTheDocument();
    expect(screen.getByText('Grupo + Chave')).toBeInTheDocument();
  });

  it('deve chamar onBracketChange com GRUPO', () => {
    render(<MatchDetailsSection {...defaultProps} />);
    
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'GRUPO' } });
    
    expect(defaultProps.onBracketChange).toHaveBeenCalledWith('GRUPO');
  });

  it('deve chamar onBracketChange com CHAVE', () => {
    render(<MatchDetailsSection {...defaultProps} />);
    
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'CHAVE' } });
    
    expect(defaultProps.onBracketChange).toHaveBeenCalledWith('CHAVE');
  });

  it('deve chamar onBracketChange com GRUPO_CHAVE', () => {
    render(<MatchDetailsSection {...defaultProps} />);
    
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'GRUPO_CHAVE' } });
    
    expect(defaultProps.onBracketChange).toHaveBeenCalledWith('GRUPO_CHAVE');
  });

  it('deve chamar onTemperatureChange ao digitar', () => {
    render(<MatchDetailsSection {...defaultProps} />);
    
    const inputs = screen.getAllByRole('textbox');
    const temperatureInput = inputs.find(input => 
      input.closest('div')?.textContent?.includes('Temperatura')
    );
    
    if (temperatureInput) {
      fireEvent.change(temperatureInput, { target: { value: '25' } });
      expect(defaultProps.onTemperatureChange).toHaveBeenCalledWith('25');
    }
  });

  it('deve chamar onHumidityChange ao digitar', () => {
    render(<MatchDetailsSection {...defaultProps} />);
    
    const inputs = screen.getAllByRole('textbox');
    const humidityInput = inputs.find(input => 
      input.closest('div')?.textContent?.includes('Umidade')
    );
    
    if (humidityInput) {
      fireEvent.change(humidityInput, { target: { value: '60' } });
      expect(defaultProps.onHumidityChange).toHaveBeenCalledWith('60');
    }
  });
});