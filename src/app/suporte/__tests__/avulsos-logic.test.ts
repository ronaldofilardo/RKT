import { splitAvulsos } from '../avulsos-logic';
import type { ExternalAthlete, MembershipItem, UserItem } from '../types';

function makeUser(id: string): UserItem {
  return {
    id, name: `User ${id}`, email: `${id}@x.com`, cpf: '1',
    role: 'ANNOTATOR', canOperate: false, isActive: true, createdAt: '2026-01-01',
  };
}

function makeMembership(
  userId: string, kind: string, ctId: string | null, status = 'ACTIVE',
): MembershipItem {
  return { id: `m-${userId}-${kind}`, userId, kind, ctId, status, createdAt: '2026-01-01' };
}

const externalAthlete: ExternalAthlete = {
  id: 'a1', name: 'Juca Externo', club: 'TCC', city: null, state: null,
  gender: null, age: null, rankings: null, createdAt: '2026-01-01',
  createdByName: null, createdByEmail: null,
};

describe('splitAvulsos', () => {
  it('mantém os atletas externos no grupo de atletas', () => {
    const groups = splitAvulsos([externalAthlete], [], []);
    expect(groups.atletas).toEqual([externalAthlete]);
  });

  it('agrupa TREINADOR sem ctId como treinador avulso', () => {
    const coach = makeUser('coach-1');
    const groups = splitAvulsos([], [coach, makeUser('u-2')], [
      makeMembership('coach-1', 'TREINADOR', null),
    ]);

    expect(groups.treinadores).toEqual([coach]);
  });

  it('não conta TREINADOR com ctId ativo como avulso', () => {
    const clubCoach = makeUser('coach-club');
    const groups = splitAvulsos([], [clubCoach], [
      makeMembership('coach-club', 'TREINADOR', 'ct-1', 'ACTIVE'),
    ]);

    expect(groups.treinadores).toEqual([]);
  });

  it('conta TREINADOR com ctId suspenso como avulso', () => {
    const suspended = makeUser('coach-susp');
    const groups = splitAvulsos([], [suspended], [
      makeMembership('coach-susp', 'TREINADOR', 'ct-1', 'SUSPENDED'),
    ]);

    expect(groups.treinadores).toEqual([suspended]);
  });

  it('agrupa usuários sem nenhum vínculo como espectadores', () => {
    const free = makeUser('free-1');
    const linked = makeUser('gestor-1');
    const groups = splitAvulsos([], [free, linked], [
      makeMembership('gestor-1', 'GESTOR', 'ct-1'),
    ]);

    expect(groups.espectadores).toEqual([free]);
  });

  it('exclui conta de atleta dos espectadores', () => {
    const athlete = { ...makeUser('athlete-1'), hasPlayer: true };
    const spectator = makeUser('free-2');
    const groups = splitAvulsos([], [athlete, spectator], []);

    expect(groups.espectadores).toEqual([spectator]);
  });

  it('exclui administradores de todas as listas', () => {
    const admin = { ...makeUser('admin-1'), role: 'ADMIN' };
    const groups = splitAvulsos([], [admin], []);

    expect(groups.espectadores).toEqual([]);
    expect(groups.atletasComConta).toEqual([]);
  });

  it('agrupa conta de atleta sem clube em atletasComConta', () => {
    const semClube = { ...makeUser('a1'), hasPlayer: true, hasPlayerCt: false };
    const comClube = { ...makeUser('a2'), hasPlayer: true, hasPlayerCt: true };
    const groups = splitAvulsos([], [semClube, comClube], []);

    expect(groups.atletasComConta).toEqual([semClube]);
  });
});
