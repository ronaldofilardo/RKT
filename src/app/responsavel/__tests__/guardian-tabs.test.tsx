/** @jest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react';
import { GuardianTabsNav } from '../guardian-tabs-nav';

describe('GuardianTabsNav', () => {
  it('renderiza as 4 abas e permite alternar entre elas', () => {
    const handleSelect = jest.fn();
    render(
      <GuardianTabsNav
        currentTab="autorizacoes"
        onSelectTab={handleSelect}
        matchesCount={5}
        avisosCount={2}
      />,
    );

    expect(screen.getByText(/Autorizações/i)).toBeInTheDocument();
    expect(screen.getByText(/Partidas/i)).toBeInTheDocument();
    expect(screen.getByText(/Avisos/i)).toBeInTheDocument();
    expect(screen.getByText(/Acessos/i)).toBeInTheDocument();
    expect(screen.getByText(/Ajuda/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Avisos/i));
    expect(handleSelect).toHaveBeenCalledWith('avisos');
    fireEvent.click(screen.getByText(/Ajuda/i));
    expect(handleSelect).toHaveBeenCalledWith('ajuda');
  });
});
