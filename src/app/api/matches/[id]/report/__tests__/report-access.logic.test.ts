import { checkReportAccess } from '../report-access.logic';
import { actor, CT, member } from '@/core/access/__tests__/fixtures';

const matchAccess = {
  createdByUserId: 'creator',
  ctId: CT,
  annotatorUserIds: ['annotator'],
  participantPlayerIds: ['player-1', 'player-2'],
  participantCtIds: [],
};

describe('checkReportAccess', () => {
  it('denies a coach (even following participant) who is not the annotation owner', () => {
    const coach = actor({
      followedPlayerIds: ['player-1'],
      memberships: [member('TREINADOR', { ctId: CT })],
    });

    expect(checkReportAccess(coach, { state: 'FINISHED' }, matchAccess)?.status).toBe(403);
  });

  it('allows the annotation owner and the club gestor', () => {
    const owner = actor({ userId: 'creator', canOperate: true });
    const gestor = actor({ memberships: [member('GESTOR', { ctId: CT })] });

    expect(checkReportAccess(owner, { state: 'FINISHED' }, matchAccess)).toBeNull();
    expect(checkReportAccess(gestor, { state: 'FINISHED' }, matchAccess)).toBeNull();
  });

  it('denies a coach without an active follow relationship', () => {
    const coach = actor({ memberships: [member('TREINADOR', { ctId: 'other-ct' })] });

    expect(checkReportAccess(coach, { state: 'FINISHED' }, matchAccess)?.status).toBe(403);
  });

  it('does not allow platform support to read match reports', () => {
    const support = actor({ memberships: [member('PLATAFORMA', { preset: 'SUPORTE' })] });

    expect(checkReportAccess(support, { state: 'FINISHED' }, matchAccess)?.status).toBe(403);
  });

  it('returns not-found and cancelled responses before evaluating visibility', () => {
    const creator = actor({ userId: 'creator', canOperate: true });

    expect(checkReportAccess(creator, null, matchAccess)?.status).toBe(404);
    expect(checkReportAccess(creator, { state: 'CANCELLED' }, matchAccess)?.status).toBe(410);
  });
});
