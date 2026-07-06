import { render, screen } from '@testing-library/react';
import { ScoreboardCard } from '../ScoreboardCard';

describe('ScoreboardCard', () => {
  const mockPlayer1 = { id: '1', name: 'Player One' };
  const mockPlayer2 = { id: '2', name: 'Player Two' };

  const mockScoreState = {
    sets: [
      { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
      { player1: 3, player2: 2, isTiebreak: false, tiebreakScore: null },
    ],
    setsWon: {
      player1: 1,
      player2: 0,
    },
  };

  it('renders player names correctly', () => {
    render(
      <ScoreboardCard
        player1={mockPlayer1}
        player2={mockPlayer2}
        scoreState={mockScoreState}
      />
    );
    expect(screen.getByText('Player One')).toBeInTheDocument();
    expect(screen.getByText('Player Two')).toBeInTheDocument();
  });

  it('renders completed set scores correctly', () => {
    render(
      <ScoreboardCard
        player1={mockPlayer1}
        player2={mockPlayer2}
        scoreState={mockScoreState}
      />
    );
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('renders current set score correctly', () => {
    render(
      <ScoreboardCard
        player1={mockPlayer1}
        player2={mockPlayer2}
        scoreState={mockScoreState}
      />
    );
    const currentSetScores = screen.getAllByText('3');
    expect(currentSetScores[0]).toBeInTheDocument();
    const currentSetScoresP2 = screen.getAllByText('2');
    expect(currentSetScoresP2[0]).toBeInTheDocument();
  });

  it('marks current set with "atual" label', () => {
    render(
      <ScoreboardCard
        player1={mockPlayer1}
        player2={mockPlayer2}
        scoreState={mockScoreState}
      />
    );
    expect(screen.getByText('atual')).toBeInTheDocument();
  });

  it('renders sets won summary correctly', () => {
    render(
      <ScoreboardCard
        player1={mockPlayer1}
        player2={mockPlayer2}
        scoreState={mockScoreState}
      />
    );
    expect(screen.getByText('1-0')).toBeInTheDocument();
  });

  it('displays checkmark for completed sets', () => {
    render(
      <ScoreboardCard
        player1={mockPlayer1}
        player2={mockPlayer2}
        scoreState={mockScoreState}
      />
    );
    const checkmarks = screen.getAllByText('✓');
    expect(checkmarks.length).toBeGreaterThan(0);
  });

  it('applies suspended styling when isSuspended is true', () => {
    render(
      <ScoreboardCard
        player1={mockPlayer1}
        player2={mockPlayer2}
        scoreState={mockScoreState}
        isSuspended
      />
    );
    const card = screen.getByText('Player One').closest('div');
    expect(card).toHaveClass('bg-amber-50', 'border-amber-200');
  });

  it('applies regular styling when isSuspended is false', () => {
    render(
      <ScoreboardCard
        player1={mockPlayer1}
        player2={mockPlayer2}
        scoreState={mockScoreState}
        isSuspended={false}
      />
    );
    const card = screen.getByText('Player One').closest('div');
    expect(card).toHaveClass('bg-white', 'border-gray-200');
  });

  it('renders with empty score state', () => {
    render(
      <ScoreboardCard
        player1={mockPlayer1}
        player2={mockPlayer2}
        scoreState={{ sets: [], setsWon: { player1: 0, player2: 0 } }}
      />
    );
    expect(screen.getByText('Player One')).toBeInTheDocument();
    expect(screen.getByText('Player Two')).toBeInTheDocument();
  });

  it('renders with null score state', () => {
    render(
      <ScoreboardCard
        player1={mockPlayer1}
        player2={mockPlayer2}
        scoreState={null as any}
      />
    );
    expect(screen.getByText('Player One')).toBeInTheDocument();
    expect(screen.getByText('Player Two')).toBeInTheDocument();
  });

  it('renders tiebreak set correctly', () => {
    const tiebreakScoreState = {
      sets: [
        { player1: 7, player2: 6, isTiebreak: true, tiebreakScore: { player1: 7, player2: 5 } },
      ],
      setsWon: {
        player1: 1,
        player2: 0,
      },
    };
    render(
      <ScoreboardCard
        player1={mockPlayer1}
        player2={mockPlayer2}
        scoreState={tiebreakScoreState}
      />
    );
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('renders multiple completed sets with numbered headers', () => {
    const multiSetScoreState = {
      sets: [
        { player1: 6, player2: 3, isTiebreak: false, tiebreakScore: null },
        { player1: 4, player2: 6, isTiebreak: false, tiebreakScore: null },
        { player1: 2, player2: 1, isTiebreak: false, tiebreakScore: null },
      ],
      setsWon: {
        player1: 1,
        player2: 1,
      },
    };
    render(
      <ScoreboardCard
        player1={mockPlayer1}
        player2={mockPlayer2}
        scoreState={multiSetScoreState}
      />
    );
    const set1Headers = screen.getAllByText('1');
    const set2Headers = screen.getAllByText('2');
    const atualLabels = screen.getAllByText('atual');
    expect(set1Headers.length).toBeGreaterThan(0);
    expect(set2Headers.length).toBeGreaterThan(0);
    expect(atualLabels.length).toBeGreaterThan(0);
  });
});