import { render, screen } from '@testing-library/react';
import { MatchHeader } from '../MatchHeader';

describe('MatchHeader', () => {
  const mockProps = {
    elapsedSeconds: 0,
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

  it('renders elapsed time in MM:SS format', () => {
    render(<MatchHeader {...mockProps} elapsedSeconds={125} />);
    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('renders elapsed time in H:MM:SS format when over an hour', () => {
    render(<MatchHeader {...mockProps} elapsedSeconds={3665} />);
    expect(screen.getByText('1h 1:05')).toBeInTheDocument();
  });

  it('renders elapsed time with zero padding for seconds', () => {
    render(<MatchHeader {...mockProps} elapsedSeconds={65} />);
    expect(screen.getByText('1:05')).toBeInTheDocument();
  });

  it('renders timeline button when onTimeline is provided', () => {
    render(<MatchHeader {...mockProps} onTimeline={jest.fn()} />);
    const timelineButton = screen.getByText('📊');
    expect(timelineButton).toBeInTheDocument();
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