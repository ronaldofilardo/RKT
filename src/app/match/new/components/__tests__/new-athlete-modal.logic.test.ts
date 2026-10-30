import { buildAthletePayload, validateAthleteForm } from '../new-athlete-modal.logic';
import { initialRankings } from '@/app/atletas/rankingLogic';

describe('new-athlete-modal.logic', () => {
  it('preenche birthYear e birthDate quando data completa fornecida', () => {
    const payload = buildAthletePayload(
      {
        name: 'Rafael',
        gender: 'MALE',
        birthDay: '15',
        birthMonth: '05',
        birthYear: '2008',
        dominance: 'LEFT',
        backhand: 'TWO_HANDED',
      },
      initialRankings(),
    );

    expect(payload.name).toBe('Rafael');
    expect(payload.birthDate).toBe('2008-05-15');
    expect(payload.birthYear).toBe(2008);
  });

  it('permite cadastro com somente birthYear e calcula payload sem birthDate', () => {
    const payload = buildAthletePayload(
      {
        name: 'Carlos',
        gender: 'MALE',
        birthDay: '',
        birthMonth: '',
        birthYear: '2010',
        dominance: '',
        backhand: '',
      },
      initialRankings(),
    );

    expect(payload.name).toBe('Carlos');
    expect(payload.birthDate).toBeUndefined();
    expect(payload.birthYear).toBe(2010);
  });

  it('valida que nome é obrigatório', () => {
    expect(
      validateAthleteForm({
        name: '   ',
        gender: '',
        birthDay: '',
        birthMonth: '',
        birthYear: '',
        dominance: '',
        backhand: '',
      }),
    ).toBe('Nome é obrigatório.');

    expect(
      validateAthleteForm({
        name: 'Novak',
        gender: '',
        birthDay: '',
        birthMonth: '',
        birthYear: '',
        dominance: '',
        backhand: '',
      }),
    ).toBeNull();
  });
});

