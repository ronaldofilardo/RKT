/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SportFormatSection } from '../SportFormatSection';

describe('SportFormatSection Real Tests', () => {
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

  it('renderiza os seletores de esporte, formato e tipo de quadra quando esporte é TENNIS', () => {
    render(<SportFormatSection {...defaultProps} />);

    expect(screen.getByLabelText(/ESPORTE/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/FORMATO/i)).toBeInTheDocument();
    expect(screen.getByText(/TIPO DE QUADRA/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Saibro/i })).toBeInTheDocument();
  });

  it('chama onFormatChange quando o formato é alterado', () => {
    render(<SportFormatSection {...defaultProps} />);

    const formatSelect = screen.getByLabelText(/FORMATO/i);
    fireEvent.change(formatSelect, { target: { value: 'BEST_OF_3_MATCH_TB' } });

    expect(defaultProps.onFormatChange).toHaveBeenCalledWith('BEST_OF_3_MATCH_TB');
  });

  it('não renderiza campo de tipo de quadra quando o esporte não for TENNIS', () => {
    render(<SportFormatSection {...defaultProps} sportType="BEACH_TENNIS" />);

    expect(screen.queryByText(/TIPO DE QUADRA/i)).toBeNull();
  });
});
