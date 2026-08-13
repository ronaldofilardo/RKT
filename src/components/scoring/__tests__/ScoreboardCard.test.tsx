/**
 * @jest-environment jsdom
 */
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
    // Tie-break: deve mostrar os pontos do tiebreak (7x5), não os games (7x6)
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
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

  // ─── Caracterização do bug do "set atual" (2026-08-13) ───────────────
  // Cenário: ao ajustar o placar e confirmar um set finalizado como último
  // item do array (sem adicionar o próximo set ainda), o ScoreboardCard
  // destacava o set finalizado em verde como se fosse "atual".
  // Esperado após correção: o set finalizado deve aparecer com label do set
  // (número) e destaque de vencedor/perdedor; o "atual" deve recair sobre o
  // set em andamento (vazio quando aplicável).
  describe('Correção bug "set atual" - set finalizado ao fim do array', () => {
    it('NÃO marca set finalizado como "atual" quando é o último do array (formato BEST_OF_3)', () => {
      // Estado após edição que confirma apenas 1 set completado (6-4) e a
      // partida ainda não terminou (setsWon 1x0 no BEST_OF_3). Sem o set
      // em andamento no array, o último item é o set recém-finalizado.
      const bugScoreState = {
        sets: [
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
        ],
        setsWon: { player1: 1, player2: 0 },
        isFinished: false,
        winner: null,
      };
      render(
        <ScoreboardCard
          player1={mockPlayer1}
          player2={mockPlayer2}
          scoreState={bugScoreState}
          format="BEST_OF_3"
        />
      );
      // O set finalizado deve ser rotulado como '1', NÃO como 'atual'
      expect(screen.queryByText('atual')).toBeNull();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('marca o set em andamento (não-finalizado) como "atual"', () => {
      // Estado correto: 1 set finalizado + 1 set em andamento (recém-criado vazio)
      const goodScoreState = {
        sets: [
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
          { player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null },
        ],
        setsWon: { player1: 1, player2: 0 },
        isFinished: false,
        winner: null,
      };
      render(
        <ScoreboardCard
          player1={mockPlayer1}
          player2={mockPlayer2}
          scoreState={goodScoreState}
          format="BEST_OF_3"
        />
      );
      expect(screen.getByText('atual')).toBeInTheDocument();
    });

    it('NÃO marca set finalizado (2-sets) como "atual" quando partida ainda não acabou', () => {
      // BEST_OF_3: 6-4 / 6-3 → venceu player1 2x0 → partida finalizada.
      // Nesse caso não há "atual"; tela de placar finalizado deve exibir números.
      const finishedScoreState = {
        sets: [
          { player1: 6, player2: 4, isTiebreak: false, tiebreakScore: null },
          { player1: 6, player2: 3, isTiebreak: false, tiebreakScore: null },
        ],
        setsWon: { player1: 2, player2: 0 },
        isFinished: true,
        winner: 'player1',
      };
      render(
        <ScoreboardCard
          player1={mockPlayer1}
          player2={mockPlayer2}
          scoreState={finishedScoreState}
          format="BEST_OF_3"
        />
      );
      // Quando finalizado, todos os sets têm números - nenhum "atual"
      expect(screen.queryByText('atual')).toBeNull();
    });
  });
});