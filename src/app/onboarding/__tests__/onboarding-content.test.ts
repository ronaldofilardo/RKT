import { ONBOARDING_CONTENT } from '../onboarding-content';

describe('ONBOARDING_CONTENT', () => {
  it('cobre os quatro perfis do plano', () => {
    expect(Object.keys(ONBOARDING_CONTENT).sort()).toEqual(
      ['ATLETA', 'ESPECTADOR', 'GESTOR', 'TREINADOR'].sort(),
    );
  });

  it.each(['ATLETA', 'TREINADOR', 'GESTOR', 'ESPECTADOR'] as const)(
    'tem três etapas completas para %s',
    (profile) => {
      const content = ONBOARDING_CONTENT[profile];
      expect(content.steps).toHaveLength(3);
      for (const step of content.steps) {
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
        expect(step.highlights.length).toBeGreaterThanOrEqual(2);
      }
    },
  );

  it('mantém os títulos definidos no plano', () => {
    expect(ONBOARDING_CONTENT.ATLETA.steps[1].title).toBe('Como ler seus gráficos de momentum e saque');
    expect(ONBOARDING_CONTENT.TREINADOR.steps[0].title).toBe('Visão geral da gestão da sua equipe');
    expect(ONBOARDING_CONTENT.GESTOR.steps[1].title).toBe('Gestão de licenças, treinadores e atletas');
    expect(ONBOARDING_CONTENT.ESPECTADOR.steps[2].title).toBe('Iniciar sua primeira anotação avulsa');
  });
});
