import { screen, fireEvent } from '@testing-library/react';

export function acceptTermsInModal() {
  fireEvent.click(screen.getByRole('link', { name: /Termos de Uso/i }));
  const scroll = screen.getByTestId('terms-modal-scroll');
  Object.defineProperty(scroll, 'scrollHeight', { value: 1000, writable: true, configurable: true });
  Object.defineProperty(scroll, 'clientHeight', { value: 300, writable: true, configurable: true });
  Object.defineProperty(scroll, 'scrollTop', { value: 690, writable: true, configurable: true });
  fireEvent.scroll(scroll);
  fireEvent.click(screen.getByRole('button', { name: /Política de Privacidade/i }));
  scroll.scrollTop = 690;
  fireEvent.scroll(scroll);
  fireEvent.click(screen.getByRole('button', { name: /Concordo/i }));
}
