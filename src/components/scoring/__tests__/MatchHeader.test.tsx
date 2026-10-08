/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { MatchHeader } from '../MatchHeader';

describe('MatchHeader', () => {
  const mockProps = {
    onClose: jest.fn(),
    isFinished: false,
  };

  it('renders close button when match is not finished', () => {
    render(<MatchHeader {...mockProps} />);
    const closeButton = screen.getByRole('button', { name: /fechar/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('does not render close button when match is finished', () => {
    render(<MatchHeader {...mockProps} isFinished />);
    const closeButton = screen.queryByRole('button', { name: /fechar/i });
    expect(closeButton).not.toBeInTheDocument();
  });

  it('renders the app name in the header (also when finished)', () => {
    const { rerender } = render(<MatchHeader {...mockProps} />);
    expect(screen.getByText('RKT app')).toBeInTheDocument();
    rerender(<MatchHeader {...mockProps} isFinished />);
    expect(screen.getByText('RKT app')).toBeInTheDocument();
  });

  it('does not render the elapsed timer anymore', () => {
    render(<MatchHeader {...mockProps} />);
    expect(screen.queryByText(/^\d+:\d{2}$/)).not.toBeInTheDocument();
  });

  it('does not render the timeline icon even when onTimeline is provided', () => {
    render(<MatchHeader {...mockProps} onTimeline={jest.fn()} />);
    expect(screen.queryByText('📊')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /linha do tempo/i })).not.toBeInTheDocument();
  });

  it('does not render the theme toggle (moved to the ActionBar footer)', () => {
    render(<MatchHeader {...mockProps} />);
    expect(screen.queryByTestId('theme-toggle-light')).not.toBeInTheDocument();
    expect(screen.queryByTestId('theme-toggle-dark')).not.toBeInTheDocument();
  });

  it('renders edit button when canEdit and onEditMatch are provided', () => {
    render(<MatchHeader {...mockProps} canEdit onEditMatch={jest.fn()} />);
    const editButton = screen.getByRole('button', { name: /editar partida/i });
    expect(editButton).toBeInTheDocument();
  });

  it('renders stats button when onStats is provided', () => {
    render(<MatchHeader {...mockProps} onStats={jest.fn()} />);
    const statsButton = screen.getByRole('button', { name: /estatísticas/i });
    expect(statsButton).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<MatchHeader {...mockProps} onClose={onClose} />);
    const closeButton = screen.getByRole('button', { name: /fechar/i });
    closeButton.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
