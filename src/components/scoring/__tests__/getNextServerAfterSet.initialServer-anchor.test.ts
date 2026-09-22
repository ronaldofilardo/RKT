/**
 * Regressão (2026-09-22): "âncora desatualizada" no cálculo do sacador ao
 * editar o set em andamento no modal "Editar Placar".
 *
 * Bug anterior: getNextServerAfterSet usava `currentServer` (o sacador AO
 * VIVO, já calculado a partir do placar de ANTES da edição) como se fosse
 * uma âncora fixa e imutável. Isso só funcionava por acaso quando a
 * correção do set em andamento não mudava a paridade do total de games.
 *
 * Fix: a função agora aceita `initialServer` (quem sacou o Game 1 de TODA
 * a partida — valor fixo, normalmente `match.initialServerId`) e ancora o
 * cálculo nele em vez do sacador ao vivo.
 */

import { getNextServerAfterSet } from '@/components/scoring/editScoreHelpers';
import { calculateNextServer } from '@/components/scoring/edit-score-logic';

describe('Regressão: âncora fixa (initialServer) ao corrigir set em andamento', () => {
  it('corrigir 2-1 (3 games, ímpar) para 3-1 (4 games, par) deve voltar ao sacador do Game 1, não ao sacador ao vivo desatualizado', () => {
    // Sacador real ANTES da correção (calculado a partir de 3 games reais,
    // ímpar → trocou de player1 para player2).
    const realCurrentServer = 'player2';
    // Âncora fixa: quem sacou o Game 1 da partida.
    const initialServer = 'player1';

    const corrected = getNextServerAfterSet({
      currentServer: realCurrentServer,
      initialServer,
      p1Games: 3,
      p2Games: 1,
      format: 'BEST_OF_3',
      completedSets: [],
    });

    // 4 games totais (par) → mesmo sacador do Game 1 = player1.
    expect(corrected).toBe('player1');
  });

  it('sem initialServer (compat retroativa): cai para currentServer como âncora (comportamento antigo, aceito como fallback documentado)', () => {
    const result = getNextServerAfterSet({
      currentServer: 'player2',
      p1Games: 3,
      p2Games: 1,
      format: 'BEST_OF_3',
      completedSets: [],
    });
    // Sem initialServer, currentServer vira a âncora (fallback) → 4 par → mantém.
    expect(result).toBe('player2');
  });

  it('calculateNextServer propaga initialServer corretamente para getNextServerAfterSet', () => {
    const result = calculateNextServer({
      currentServer: 'player2',
      initialServer: 'player1',
      p1Games: 3,
      p2Games: 1,
      matchFormat: 'BEST_OF_3',
      tiebreakScore: null,
      completedSets: [],
    });
    expect(result).toBe('player1');
  });

  it('correção que muda a paridade em sentido contrário (1-1 → 1-2, ímpar) também respeita a âncora fixa', () => {
    // Sacador real ANTES (2 games, par → mesmo do Game 1 = player1).
    const realCurrentServer = 'player1';
    const initialServer = 'player1';

    // Corrigido para 1-2 (3 games, ímpar).
    const corrected = getNextServerAfterSet({
      currentServer: realCurrentServer,
      initialServer,
      p1Games: 1,
      p2Games: 2,
      format: 'BEST_OF_3',
      completedSets: [],
    });

    expect(corrected).toBe('player2'); // 3 games (ímpar) → troca a partir da âncora
  });

  it('com sets já completados antes, a âncora fixa continua correta mesmo editando o set atual', () => {
    // Set 1 já completo (6-4 = 10 games, par). Sacador real do set 2 antes
    // da correção seria player1 (mesmo do Game 1, já que 10 é par).
    const initialServer = 'player1';

    // Set 2 estava em 2-1 (3 games), corrigido para 3-2 (5 games, ímpar).
    // Total: 10 + 5 = 15 (ímpar) → troca a partir da âncora fixa.
    const corrected = getNextServerAfterSet({
      currentServer: 'player2', // valor ao vivo desatualizado (baseado no 2-1 antigo: 10+3=13, ímpar → player2)
      initialServer,
      p1Games: 3,
      p2Games: 2,
      format: 'BEST_OF_3',
      completedSets: [{ player1: 6, player2: 4 }],
    });

    expect(corrected).toBe('player2'); // 15 ímpar → troca de player1 (âncora) para player2
  });
});
