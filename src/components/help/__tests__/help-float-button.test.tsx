/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { HelpFloatButton } from '../help-float-button';

function setSession(area: string | null, role: string | null) {
  sessionStorage.clear();
  if (area) sessionStorage.setItem('active_area', area);
  if (role) sessionStorage.setItem('user_role', role);
}

describe('HelpFloatButton (botão flutuante de /scoring)', () => {
  it('renderiza com link para /help quando a área tem conteúdo', () => {
    setSession('ANOTADOR', 'ANNOTATOR');
    render(<HelpFloatButton />);
    expect(screen.getByRole('link', { name: 'Abrir a Central de Ajuda' })).toHaveAttribute(
      'href',
      '/help',
    );
  });

  it('fica oculto para áreas sem conteúdo (ADMIN/SUPORTE)', () => {
    setSession('ADMIN', 'ADMIN');
    const { container } = render(<HelpFloatButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it('sem área hidratada, aparece para perfis comuns e some para ADMIN/SUPORTE', () => {
    setSession(null, 'ANNOTATOR');
    const { container, unmount } = render(<HelpFloatButton />);
    expect(screen.getByRole('link', { name: 'Abrir a Central de Ajuda' })).toBeInTheDocument();
    unmount();

    setSession(null, 'ADMIN');
    const second = render(<HelpFloatButton />);
    expect(second.container).toBeEmptyDOMElement();
  });
});
