import { buildSpectatorScoreboardProps } from '../spectator-scoreboard.logic';
import type { SpectatorView } from '@/core/spectate';

const view = (over: Partial<SpectatorView['score']> = {}, state = 'IN_PROGRESS'): SpectatorView => ({
  match: {
    id: 'm1',
    state,
    format: 'BEST_OF_3',
    matchType: 'SINGLES',
    sides: [
      { label: 'Celso Luiz Moletta Junior', members: [{ id: 'a', name: 'Celso Luiz Moletta Junior' }] },
      { label: 'Ronaldo Filardo', members: [{ id: 'b', name: 'Ronaldo Filardo' }] },
    ],
  },
  score: { sets: [], currentGame: { player1: '0', player2: '15' }, serverSide: 'side1', ...over },
  points: [],
  markers: [],
});

describe('buildSpectatorScoreboardProps', () => {
  it('abrevia nomes como no /scoring e converte o saque', () => {
    const p = buildSpectatorScoreboardProps(view());
    expect(p.displayNames).toEqual({ player1: 'C. Junior', player2: 'R. Filardo' });
    expect(p.scoreState?.server).toBe('player1');
  });

  it('mostra set 0-0 quando ainda não há sets e a coluna do game', () => {
    const p = buildSpectatorScoreboardProps(view());
    expect(p.scoreState?.sets).toEqual([{ player1: 0, player2: 0, isTiebreak: false, tiebreakScore: null }]);
    expect(p.gamePoints).toEqual({ player1: '0', player2: '15', title: 'Pts' });
  });

  it('usa título TB no tie-break e esconde o game ao encerrar', () => {
    expect(buildSpectatorScoreboardProps(view({ isTiebreak: true })).gamePoints?.title).toBe('TB');
    const finished = buildSpectatorScoreboardProps(
      view({ sets: [{ player1: 6, player2: 3 }, { player1: 6, player2: 4 }] }, 'FINISHED'),
    );
    expect(finished.gamePoints).toBeNull();
    expect(finished.scoreState?.winner).toBe('player1');
  });
});
