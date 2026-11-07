import { resolvePlayerColors, MATCH_WINNER_TEXT } from '../player-color.context';

describe('resolvePlayerColors (simples e duplas)', () => {
  const p1 = { id: 'p1_titular' };
  const p1Partner = { id: 'p1_parceiro' };
  const p2 = { id: 'p2_titular' };
  const p2Partner = { id: 'p2_parceiro' };

  it('retorna neutro quando report é nulo ou indefinido', () => {
    const res = resolvePlayerColors(null);
    expect(res.p1).toBe('text-telemetry-text-primary');
    expect(res.p2).toBe('text-telemetry-text-primary');
  });

  describe('partida finalizada (FINISHED)', () => {
    it('simples: titular p1 campeão → p1 em volt, p2 neutro', () => {
      const res = resolvePlayerColors({
        state: 'FINISHED',
        winnerId: p1.id,
        player1: p1,
        player2: p2,
      });
      expect(res.p1).toBe(MATCH_WINNER_TEXT);
      expect(res.p2).toBe('text-telemetry-text-primary');
      expect(res.p1Border).toBe('border-l-telemetry-volt');
    });

    it('duplas: parceiro da Dupla 1 campeão → Dupla 1 em volt', () => {
      const res = resolvePlayerColors({
        state: 'FINISHED',
        winnerId: p1Partner.id,
        player1: p1,
        player2: p2,
        player1Partner: p1Partner,
        player2Partner: p2Partner,
        matchType: 'DOUBLES',
      });
      expect(res.p1).toBe(MATCH_WINNER_TEXT);
      expect(res.p2).toBe('text-telemetry-text-primary');
      expect(res.p1Border).toBe('border-l-telemetry-volt');
    });

    it('duplas: parceiro da Dupla 2 campeão → Dupla 2 em volt', () => {
      const res = resolvePlayerColors({
        state: 'FINISHED',
        winnerId: p2Partner.id,
        player1: p1,
        player2: p2,
        player1Partner: p1Partner,
        player2Partner: p2Partner,
        matchType: 'DOUBLES',
      });
      expect(res.p1).toBe('text-telemetry-text-primary');
      expect(res.p2).toBe(MATCH_WINNER_TEXT);
      expect(res.p2Border).toBe('border-l-telemetry-volt');
    });
  });

  describe('partida em andamento (IN_PROGRESS) — alinhada ao /scoring', () => {
    it('duplas: parceiro da Dupla 1 no saque → Dupla 1 em volt', () => {
      const res = resolvePlayerColors({
        state: 'IN_PROGRESS',
        player1: p1,
        player2: p2,
        player1Partner: p1Partner,
        player2Partner: p2Partner,
        matchType: 'DOUBLES',
        scoreState: { server: p1Partner.id },
      });
      expect(res.p1).toBe(MATCH_WINNER_TEXT);
      expect(res.p2).toBe('text-telemetry-text-primary');
      expect(res.p1Border).toBe('border-l-telemetry-volt');
    });

    it('duplas: scoreState como string JSON com Dupla 2 sacando', () => {
      const res = resolvePlayerColors({
        state: 'IN_PROGRESS',
        player1: p1,
        player2: p2,
        player1Partner: p1Partner,
        player2Partner: p2Partner,
        matchType: 'DOUBLES',
        scoreState: JSON.stringify({ state: { server: p2Partner.id } }),
      });
      expect(res.p1).toBe('text-telemetry-text-primary');
      expect(res.p2).toBe(MATCH_WINNER_TEXT);
    });

    it('fallback para timelinePoints quando scoreState não possui server', () => {
      const res = resolvePlayerColors({
        state: 'IN_PROGRESS',
        player1: p1,
        player2: p2,
        timelinePoints: [{ serverId: p1.id }],
      });
      expect(res.p1).toBe(MATCH_WINNER_TEXT);
      expect(res.p2).toBe('text-telemetry-text-primary');
    });
  });
});
