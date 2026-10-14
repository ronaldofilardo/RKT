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

  it('marks current set with highlighted styling and set title', () => {
    render(
      <ScoreboardCard
        player1={mockPlayer1}
        player2={mockPlayer2}
        scoreState={mockScoreState}
        format="BEST_OF_3"
      />
    );
    expect(screen.getByText('Set 1')).toBeInTheDocument();
    const set2Header = screen.getByText('Set 2');
    expect(set2Header).toBeInTheDocument();
    expect(set2Header).toHaveClass('text-telemetry-volt');
  });

  it('displays checkmark for match winner', () => {
    render(
      <ScoreboardCard
        player1={mockPlayer1}
        player2={mockPlayer2}
        scoreState={{ ...mockScoreState, isFinished: true, winner: 'player1' }}
      />
    );
    const checkmarks = screen.getAllByText('✓');
    expect(checkmarks.length).toBe(1);
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
    expect(card).toHaveClass('border-telemetry-alert');
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
    expect(card).toHaveClass('border-white/10', 'bg-telemetry-card');
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

  it('renders tiebreak points in superscript format for in-progress regular tiebreak set (fix 2026-09-09)', () => {
    // Correção (2026-09-09): durante um tie-break de set normal (6-6), a
    // célula agora exibe "6⁵" / "6³" indicando games e pontos do TB em sobrescrito.
    // Antes: mostrava só "6" sem indicar que havia tiebreak em andamento.
    const tiebreakInProgressState = {
      sets: [
        {
          player1: 6,
          player2: 6,
          isTiebreak: true,
          tiebreakScore: { player1: 5, player2: 3 },
        },
      ],
      setsWon: { player1: 0, player2: 0 },
      isFinished: false,
      winner: null,
    };
    render(
      <ScoreboardCard
        player1={mockPlayer1}
        player2={mockPlayer2}
        scoreState={tiebreakInProgressState}
        format="BEST_OF_3"
      />
    );
    expect(screen.getAllByText('6')).toHaveLength(2);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders completed match tiebreak points (0-0 games) in player rows', () => {
    const completedMatchTiebreakState = {
      sets: [
        {
          player1: 0,
          player2: 0,
          isTiebreak: true,
          tiebreakScore: { player1: 7, player2: 4 },
        },
      ],
      setsWon: { player1: 1, player2: 0 },
      isFinished: false,
      winner: null,
    };
    render(
      <ScoreboardCard
        player1={mockPlayer1}
        player2={mockPlayer2}
        scoreState={completedMatchTiebreakState}
        format="BEST_OF_3"
      />
    );
    const tiebreakP1 = screen.getAllByText('7');
    expect(tiebreakP1.length).toBe(1);
    const tiebreakP2 = screen.getAllByText('4');
    expect(tiebreakP2.length).toBe(1);
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
    expect(screen.getByText('Set 1')).toBeInTheDocument();
    expect(screen.getByText('Set 2')).toBeInTheDocument();
    const set3Header = screen.getByText('Set 3');
    expect(set3Header).toBeInTheDocument();
    expect(set3Header).toHaveClass('text-telemetry-volt');
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
      // O set finalizado (Set 1) não deve estar destacado como atual; Set 2 é o atual
      expect(screen.getByText('Set 1')).not.toHaveClass('text-telemetry-volt');
      expect(screen.getByText('Set 2')).toHaveClass('text-telemetry-volt');
    });

    it('destaca a coluna do set em andamento (Set 2)', () => {
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
      expect(screen.getByText('Set 2')).toHaveClass('text-telemetry-volt');
    });

    it('NÃO destaca nenhum set como "atual" quando partida finalizou', () => {
      // BEST_OF_3: 6-4 / 6-3 → venceu player1 2x0 → partida finalizada.
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
      expect(screen.getByText('Set 1')).not.toHaveClass('text-telemetry-volt');
      expect(screen.getByText('Set 2')).not.toHaveClass('text-telemetry-volt');
    });
  });

  describe('Títulos de colunas dinâmicos e projeção de formatos', () => {
    it('formato MATCH_TB_10 exibe apenas a coluna TB', () => {
      render(
        <ScoreboardCard
          player1={mockPlayer1}
          player2={mockPlayer2}
          scoreState={{ sets: [], isFinished: false }}
          format="MATCH_TB_10"
        />
      );
      expect(screen.getByText('TB')).toBeInTheDocument();
      expect(screen.queryByText('Set 1')).toBeNull();
    });

    it('formato BEST_OF_3_MATCH_TB exibe Set 1, Set 2 e TB', () => {
      render(
        <ScoreboardCard
          player1={mockPlayer1}
          player2={mockPlayer2}
          scoreState={{ sets: [], isFinished: false }}
          format="BEST_OF_3_MATCH_TB"
        />
      );
      expect(screen.getByText('Set 1')).toBeInTheDocument();
      expect(screen.getByText('Set 2')).toBeInTheDocument();
      expect(screen.getByText('TB')).toBeInTheDocument();
    });

    it('formato BEST_OF_5 exibe 5 sets', () => {
      render(
        <ScoreboardCard
          player1={mockPlayer1}
          player2={mockPlayer2}
          scoreState={{ sets: [], isFinished: false }}
          format="BEST_OF_5"
        />
      );
      expect(screen.getByText('Set 1')).toBeInTheDocument();
      expect(screen.getByText('Set 2')).toBeInTheDocument();
      expect(screen.getByText('Set 3')).toBeInTheDocument();
      expect(screen.getByText('Set 4')).toBeInTheDocument();
      expect(screen.getByText('Set 5')).toBeInTheDocument();
    });

    it('formato SHORT_SET_2V2_NO_AD projeta 2 a 2 para ambos os atletas nos dois sets desde a criação', () => {
      render(
        <ScoreboardCard
          player1={mockPlayer1}
          player2={mockPlayer2}
          scoreState={{ sets: [], isFinished: false }}
          format="SHORT_SET_2V2_NO_AD"
        />
      );
      expect(screen.getByText('Set 1')).toBeInTheDocument();
      expect(screen.getByText('Set 2')).toBeInTheDocument();
      expect(screen.getByText('TB')).toBeInTheDocument();

      // Devem existir pelo menos 4 ocorrências de '2' (P1 Set 1, P1 Set 2, P2 Set 1, P2 Set 2)
      const twos = screen.getAllByText('2');
      expect(twos.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Indicador de Sacador (🎾)', () => {
    it('exibe a bolinha de tênis 🎾 na linha do sacador quando player1 está sacando', () => {
      const state = {
        sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
        server: 'player1' as const,
        isFinished: false,
        winner: null,
      };
      render(
        <ScoreboardCard
          player1={mockPlayer1}
          player2={mockPlayer2}
          scoreState={state}
        />
      );
      const serverBall = screen.getByLabelText('Sacador');
      expect(serverBall).toBeInTheDocument();
      expect(serverBall.textContent).toBe('🎾');
    });

    it('exibe a bolinha de tênis 🎾 na linha do sacador quando player2 está sacando', () => {
      const state = {
        sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
        server: 'player2' as const,
        isFinished: false,
        winner: null,
      };
      render(
        <ScoreboardCard
          player1={mockPlayer1}
          player2={mockPlayer2}
          scoreState={state}
        />
      );
      const serverBall = screen.getByLabelText('Sacador');
      expect(serverBall).toBeInTheDocument();
      expect(serverBall.textContent).toBe('🎾');
    });

    it('exibe a bolinha de tênis 🎾 mesmo quando server no scoreState contém o ID do jogador', () => {
      const state = {
        sets: [{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }],
        server: mockPlayer2.id as any,
        isFinished: false,
        winner: null,
      };
      render(
        <ScoreboardCard
          player1={mockPlayer1}
          player2={mockPlayer2}
          scoreState={state}
        />
      );
      const serverBall = screen.getByLabelText('Sacador');
      expect(serverBall).toBeInTheDocument();
      expect(serverBall.textContent).toBe('🎾');
    });

    it('NÃO exibe a bolinha de tênis quando a partida está finalizada', () => {
      const state = {
        sets: [{ player1: 6, player2: 3, isTiebreak: false, tiebreakScore: null }],
        server: 'player1' as const,
        isFinished: true,
        winner: 'player1' as const,
      };
      render(
        <ScoreboardCard
          player1={mockPlayer1}
          player2={mockPlayer2}
          scoreState={state}
        />
      );
      expect(screen.queryByLabelText('Sacador')).toBeNull();
      expect(screen.getByText('✓')).toBeInTheDocument();
    });
  });
});