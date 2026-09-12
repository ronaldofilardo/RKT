/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MatchDetailsSection } from '../MatchDetailsSection';

describe('MatchDetailsSection Real Tests', () => {
  const defaultProps = {
    visibility: 'PUBLIC',
    anotadorEmail: 'coach@example.com',
    venueId: '',
    publicMatchCode: 'MATCH-123',
    temperature: '25',
    humidity: '60',
    tags: 'torneio, final',
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

  it('renderiza os campos da seção de detalhes da partida', () => {
    render(<MatchDetailsSection {...defaultProps} />);

    expect(screen.getByRole('heading', { level: 2, name: /Visibilidade/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('coach@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('MATCH-123')).toBeInTheDocument();
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    expect(screen.getByDisplayValue('60')).toBeInTheDocument();
    expect(screen.getByDisplayValue('torneio, final')).toBeInTheDocument();
  });

  it('notifica alterações em campos de texto', () => {
    render(<MatchDetailsSection {...defaultProps} />);

    const tagsInput = screen.getByDisplayValue('torneio, final');
    fireEvent.change(tagsInput, { target: { value: 'semi-final' } });

    expect(defaultProps.onTagsChange).toHaveBeenCalledWith('semi-final');
  });
});
