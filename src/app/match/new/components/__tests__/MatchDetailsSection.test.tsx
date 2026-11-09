/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MatchDetailsSection } from '../MatchDetailsSection';

describe('MatchDetailsSection', () => {
  const defaultProps = {
    visibility: 'PLAYERS_ONLY',
    anotadorEmail: '',
    venueId: '',
    publicMatchCode: '',
    temperature: '',
    humidity: '',
    tags: '',
    details: '',
    onVisibilityChange: jest.fn(),
    onPublicTemplateChange: jest.fn(),
    onAnotadorChange: jest.fn(),
    onVenueChange: jest.fn(),
    onPublicCodeChange: jest.fn(),
    onTemperatureChange: jest.fn(),
    onHumidityChange: jest.fn(),
    onTagsChange: jest.fn(),
    onDetailsChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
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

  it('deve renderizar visibilidade como rádio (Privada/Pública) e disparar os handlers', () => {
    render(<MatchDetailsSection {...defaultProps} />);

    const privateRadio = screen.getByRole('radio', { name: /Privada/i });
    const publicRadio = screen.getByRole('radio', { name: /Pública/i });
    expect(privateRadio).toBeChecked();
    expect(publicRadio).not.toBeChecked();

    fireEvent.click(publicRadio);
    expect(defaultProps.onVisibilityChange).toHaveBeenCalledWith('PUBLIC');
    expect(defaultProps.onPublicTemplateChange).toHaveBeenCalledWith(true);
  });

  it('desmarca o template ao voltar para Privada', () => {
    render(<MatchDetailsSection {...defaultProps} visibility="PUBLIC" />);

    fireEvent.click(screen.getByRole('radio', { name: /Privada/i }));
    expect(defaultProps.onVisibilityChange).toHaveBeenCalledWith('PLAYERS_ONLY');
    expect(defaultProps.onPublicTemplateChange).toHaveBeenCalledWith(false);
  });

  it('deve renderizar campo livre para Detalhes e disparar onDetailsChange', () => {
    render(<MatchDetailsSection {...defaultProps} />);

    const textarea = screen.getByPlaceholderText('Observações ou detalhes adicionais da partida');
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: 'Quadra coberta, bolas novas' } });
    expect(defaultProps.onDetailsChange).toHaveBeenCalledWith('Quadra coberta, bolas novas');
  });
});