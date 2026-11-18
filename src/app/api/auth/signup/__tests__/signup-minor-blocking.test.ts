import { validateAthleteSignupAge } from '../signup-athlete-validation.logic';

describe('validateAthleteSignupAge (ECA Digital / Lei 15.211/2025)', () => {
  it('permite outros papéis sem exigir data de nascimento', () => {
    const res = validateAthleteSignupAge('TREINADOR', undefined);
    expect(res).toBeNull();
  });

  it('permite atleta sem data de nascimento para compatibilidade legada', () => {
    const res = validateAthleteSignupAge('ATLETA', undefined);
    expect(res).toBeNull();
  });

  it('bloqueia atleta com data inválida com 400', async () => {
    const res = validateAthleteSignupAge('ATLETA', 'data-invalida');
    expect(res?.status).toBe(400);
    const json = await res?.json();
    expect(json.error).toBe('INVALID_BIRTHDATE');
  });

  it('bloqueia atleta menor de 18 anos com 403 MINOR_REQUIRES_GUARDIAN', async () => {
    // 10 anos atrás
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

    const res = validateAthleteSignupAge('ATLETA', tenYearsAgo.toISOString());
    expect(res?.status).toBe(403);
    const json = await res?.json();
    expect(json.error).toBe('MINOR_REQUIRES_GUARDIAN');
    expect(json.message).toContain('ECA Digital');
  });

  it('aprova atleta maior de 18 anos', () => {
    // 25 anos atrás
    const twentyFiveYearsAgo = new Date();
    twentyFiveYearsAgo.setFullYear(twentyFiveYearsAgo.getFullYear() - 25);

    const res = validateAthleteSignupAge('ATLETA', twentyFiveYearsAgo.toISOString());
    expect(res).toBeNull();
  });
});
