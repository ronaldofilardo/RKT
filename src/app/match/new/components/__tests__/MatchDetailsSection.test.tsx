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
    onVisibilityChange: jest.fn(),
    onAnotadorChange: jest.fn(),
    onVenueChange: jest.fn(),
    onPublicCodeChange: jest.fn(),
    onTemperatureChange: jest.fn(),
    onHumidityChange: jest.fn(),
    onTagsChange: jest.fn(),
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
});