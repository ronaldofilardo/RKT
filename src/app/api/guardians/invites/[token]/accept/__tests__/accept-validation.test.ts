import { validateGuardianCrossCheck } from '../accept-validation.logic';

describe('validateGuardianCrossCheck', () => {
  it('permite chamada sem CPF se não for informado', () => {
    const res = validateGuardianCrossCheck({ preGuardianCpf: null }, null);
    expect(res.ok).toBe(true);
    expect(res.cleanedCpf).toBeNull();
  });

  it('rejeita CPF com formato inválido', () => {
    const res = validateGuardianCrossCheck({ preGuardianCpf: null }, '111.222.333-44');
    expect(res.ok).toBe(false);
    expect(res.error).toBe('INVALID_CPF');
  });

  it('rejeita se o CPF informado divergir do CPF pré-cadastrado no clube', () => {
    // CPFs válidos diferentes
    const res = validateGuardianCrossCheck(
      { preGuardianCpf: '52998224725' },
      '01234567890', // invalid DV or different
    );
    expect(res.ok).toBe(false);
  });

  it('aprova e eleva para N2_PRE_VALIDADO quando o CPF informado confere com o pré-cadastrado', () => {
    const validCpf = '52998224725';
    const res = validateGuardianCrossCheck(
      { preGuardianCpf: validCpf },
      '529.982.247-25',
    );
    expect(res.ok).toBe(true);
    expect(res.cleanedCpf).toBe('52998224725');
    expect(res.isPreValidated).toBe(true);
  });

  it('aceita CPF válido quando o clube não tiver pré-cadastrado CPF', () => {
    const validCpf = '52998224725';
    const res = validateGuardianCrossCheck(
      { preGuardianCpf: null },
      '529.982.247-25',
    );
    expect(res.ok).toBe(true);
    expect(res.cleanedCpf).toBe('52998224725');
    expect(res.isPreValidated).toBe(false);
  });
});
