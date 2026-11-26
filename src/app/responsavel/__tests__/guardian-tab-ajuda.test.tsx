/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { GuardianTabAjuda } from '../guardian-tab-ajuda';

jest.mock('@/components/help/help-search', () => ({
  HelpSearch: () => <div data-testid="help-search">Busca</div>,
}));

describe('GuardianTabAjuda', () => {
  it('renderiza busca e destaque de proteção em partidas compartilhadas', () => {
    render(<GuardianTabAjuda />);
    expect(screen.getByText('Central de Ajuda do Responsável')).toBeInTheDocument();
    expect(screen.getByTestId('help-search')).toBeInTheDocument();
    expect(screen.getByText(/Destaque: Proteção em Partidas Compartilhadas/i)).toBeInTheDocument();
    expect(screen.getByText(/Bloqueio por BROADCAST/i)).toBeInTheDocument();
  });

  it('renderiza diretrizes de ECA Digital e LGPD para menores', () => {
    render(<GuardianTabAjuda />);
    expect(screen.getByText(/Monotutela Estrita/i)).toBeInTheDocument();
    expect(screen.getByText(/Pseudonimização/i)).toBeInTheDocument();
    expect(screen.getByText(/Emancipação aos 18 anos/i)).toBeInTheDocument();
  });

  it('renderiza links para guias, termo do responsável, privacidade e glosário', () => {
    render(<GuardianTabAjuda />);
    expect(screen.getByRole('link', { name: /Termo do Responsável/i })).toHaveAttribute('href', '/termos/responsavel');
    expect(screen.getByRole('link', { name: /Política de Privacidade/i })).toHaveAttribute('href', '/privacidade');
    expect(screen.getByRole('link', { name: /Glosário do RKT/i })).toHaveAttribute('href', '/help/glosario');
  });
});
