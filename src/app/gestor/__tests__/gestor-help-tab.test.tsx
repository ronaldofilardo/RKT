/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { GestorHelpTab } from '../gestor-help-tab';

jest.mock('@/components/help/help-search', () => ({
  HelpSearch: () => <div data-testid="help-search">Busca</div>,
}));

describe('GestorHelpTab', () => {
  it('renderiza o cabeçalho e componente de busca da Central de Ajuda', () => {
    render(<GestorHelpTab />);
    expect(screen.getByText('Central de Ajuda do Gestor')).toBeInTheDocument();
    expect(screen.getByTestId('help-search')).toBeInTheDocument();
  });

  it('renderiza links para tópicos específicos do Gestor', () => {
    render(<GestorHelpTab />);
    expect(screen.getByText('Por onde começar')).toBeInTheDocument();
    expect(screen.getByText('Gestão de membros')).toBeInTheDocument();
    expect(screen.getByText('Partidas e solicitações')).toBeInTheDocument();
  });

  it('renderiza links de referências rápidas para Glosário e FAQ', () => {
    render(<GestorHelpTab />);
    expect(screen.getByRole('link', { name: /Glosário do RKT/i })).toHaveAttribute('href', '/help/glosario');
    expect(screen.getByRole('link', { name: /Perguntas Frequentes/i })).toHaveAttribute('href', '/help/faq');
  });
});
