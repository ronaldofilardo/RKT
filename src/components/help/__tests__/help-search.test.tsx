/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { HelpSearch } from '../help-search';

const input = () => screen.getByLabelText('Buscar na Central de Ajuda');

describe('HelpSearch (busca full-text da Central de Ajuda)', () => {
  it('encontra artigos por termo presente no conteúdo', () => {
    render(<HelpSearch />);
    fireEvent.change(input(), { target: { value: 'tiebreak' } });
    const hit = screen.getByRole('link', { name: /Glosário/ });
    expect(hit).toHaveAttribute('href', '/help/glosario');
  });

  it('mostra estado vazio para termo sem resultados', () => {
    render(<HelpSearch />);
    fireEvent.change(input(), { target: { value: 'zzqqxx' } });
    expect(screen.getByText(/Nenhum artigo encontrado/)).toBeInTheDocument();
  });

  it('não busca com menos de 2 caracteres', () => {
    render(<HelpSearch />);
    fireEvent.change(input(), { target: { value: 't' } });
    expect(screen.queryByText(/Nenhum artigo encontrado/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('limpa os resultados ao apagar a busca', () => {
    render(<HelpSearch />);
    fireEvent.change(input(), { target: { value: 'convite' } });
    expect(screen.getAllByRole('link').length).toBeGreaterThan(0);
    fireEvent.change(input(), { target: { value: '' } });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
