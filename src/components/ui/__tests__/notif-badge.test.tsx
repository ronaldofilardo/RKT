/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { NotifBadge } from '../notif-badge';

describe('NotifBadge', () => {
  it('não renderiza nada se count for 0 ou negativo', () => {
    const { container } = render(<NotifBadge count={0} />);
    expect(container.firstChild).toBeNull();

    const { container: negContainer } = render(<NotifBadge count={-2} />);
    expect(negContainer.firstChild).toBeNull();
  });

  it('renderiza o número exato quando menor que 100', () => {
    render(<NotifBadge count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('exibe "99+" quando count for 100 ou maior', () => {
    render(<NotifBadge count={100} />);
    expect(screen.getByText('99+')).toBeInTheDocument();

    render(<NotifBadge count={250} />);
    expect(screen.getAllByText('99+')).toHaveLength(2);
  });
});

