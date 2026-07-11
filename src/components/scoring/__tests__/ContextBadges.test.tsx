/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { ContextBadges } from '../ContextBadges';

describe('ContextBadges', () => {
  const defaultMockProps = {
    isMatchPoint: false,
    isSetPoint: false,
    isBreakPoint: false,
    isTiebreak: false,
    isSuperTiebreak: false,
    pointsHistory: [] as string[],
  };

  it('renders null when there are no badges to display', () => {
    const { container } = render(<ContextBadges {...defaultMockProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Super Tie-Break badge when isSuperTiebreak is true', () => {
    render(<ContextBadges {...defaultMockProps} isSuperTiebreak />);
    expect(screen.getByText(/Super Tie-Break!/i)).toBeInTheDocument();
    expect(screen.getByText('🎾')).toBeInTheDocument();
  });

  it('renders Tie-Break badge when isTiebreak is true', () => {
    render(<ContextBadges {...defaultMockProps} isTiebreak />);
    expect(screen.getByText(/Tie-Break!/i)).toBeInTheDocument();
    expect(screen.getByText('🎾')).toBeInTheDocument();
  });

  it('renders Set Point badge when isSetPoint is true', () => {
    render(<ContextBadges {...defaultMockProps} isSetPoint />);
    expect(screen.getByText(/Set Point!/i)).toBeInTheDocument();
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });

  it('renders Break Point badge when isBreakPoint is true', () => {
    render(<ContextBadges {...defaultMockProps} isBreakPoint />);
    expect(screen.getByText(/Break Point!/i)).toBeInTheDocument();
    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('does not render Break Point when Set Point is also true', () => {
    render(
      <ContextBadges
        {...defaultMockProps}
        isSetPoint
        isBreakPoint
      />
    );
    expect(screen.getByText(/Set Point!/i)).toBeInTheDocument();
    expect(screen.queryByText(/Break Point!/i)).not.toBeInTheDocument();
  });

  it('renders 3 pontos seguidos badge when last 3 points are the same', () => {
    render(
      <ContextBadges
        {...defaultMockProps}
        pointsHistory={['player1', 'player1', 'player1']}
      />
    );
    expect(screen.getByText(/3 pontos seguidos/i)).toBeInTheDocument();
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('does not render 3 pontos seguidos when points are different', () => {
    render(
      <ContextBadges
        {...defaultMockProps}
        pointsHistory={['player1', 'player2', 'player1']}
      />
    );
    expect(screen.queryByText(/3 pontos seguidos/i)).not.toBeInTheDocument();
  });

  it('does not render 3 pontos seguidos when less than 3 points', () => {
    render(
      <ContextBadges
        {...defaultMockProps}
        pointsHistory={['player1', 'player1']}
      />
    );
    expect(screen.queryByText(/3 pontos seguidos/i)).not.toBeInTheDocument();
  });

  it('renders multiple badges when multiple conditions are met', () => {
    render(
      <ContextBadges
        {...defaultMockProps}
        isTiebreak
        isSetPoint
        pointsHistory={['player1', 'player1', 'player1']}
      />
    );
    expect(screen.getByText(/Tie-Break!/i)).toBeInTheDocument();
    expect(screen.getByText(/Set Point!/i)).toBeInTheDocument();
    expect(screen.getByText(/3 pontos seguidos/i)).toBeInTheDocument();
  });

  it('has correct styling for Super Tie-Break badge', () => {
    render(<ContextBadges {...defaultMockProps} isSuperTiebreak />);
    const badge = screen.getByText(/Super Tie-Break!/i);
    expect(badge).toHaveClass('bg-red-100', 'text-red-700', 'border-red-200');
  });

  it('has correct styling for Tie-Break badge', () => {
    render(<ContextBadges {...defaultMockProps} isTiebreak />);
    const badge = screen.getByText(/Tie-Break!/i);
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-700', 'border-amber-200');
  });

  it('has correct styling for Set Point badge', () => {
    render(<ContextBadges {...defaultMockProps} isSetPoint />);
    const badge = screen.getByText(/Set Point!/i);
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-700', 'border-amber-200');
  });

  it('has correct styling for Break Point badge', () => {
    render(<ContextBadges {...defaultMockProps} isBreakPoint />);
    const badge = screen.getByText(/Break Point!/i);
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-700', 'border-blue-200');
  });
});