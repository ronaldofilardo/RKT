import { initialForm, type PointDetailsForm } from '../point-details-logic';
import {
  computeScrollTop,
  getNextStep,
  isStepVisible,
} from '../usePointDetailsScroll.helpers';

const form = (patch: Partial<PointDetailsForm>): PointDetailsForm => ({ ...initialForm, ...patch });

describe('getNextStep - cascata do modal Detalhes do ponto', () => {
  it('nada mudou -> null', () => {
    expect(getNextStep(initialForm, initialForm, 'sacador')).toBeNull();
  });

  it('situação -> tipo', () => {
    expect(getNextStep(initialForm, form({ situacao: 'fundo' }), 'sacador')).toBe('tipo');
  });

  it('tipo -> golpe (não o próprio tipo)', () => {
    const prev = form({ situacao: 'fundo' });
    expect(getNextStep(prev, form({ situacao: 'fundo', tipo: 'winner' }), 'sacador')).toBe('golpe');
  });

  it('golpe -> efeito (fundo)', () => {
    const prev = form({ situacao: 'fundo', tipo: 'winner' });
    expect(getNextStep(prev, form({ situacao: 'fundo', tipo: 'winner', golpe: 'fh' }), 'sacador')).toBe('efeito');
  });

  it('golpe -> subtipo1 (rede + erro, sacador)', () => {
    const prev = form({ situacao: 'rede', tipo: 'erro_nao_forcado' });
    const curr = form({ situacao: 'rede', tipo: 'erro_nao_forcado', golpe: 'fh' });
    expect(getNextStep(prev, curr, 'sacador')).toBe('subtipo1');
  });

  it('subtipo1 -> efeito', () => {
    const base = { situacao: 'rede', tipo: 'erro_nao_forcado', golpe: 'fh' } as const;
    expect(getNextStep(form(base), form({ ...base, subtipo1: 'passing_shot' }), 'sacador')).toBe('efeito');
  });

  it('efeito -> direção', () => {
    const base = { situacao: 'fundo', tipo: 'winner', golpe: 'fh' } as const;
    expect(getNextStep(form(base), form({ ...base, efeito: 'flat' }), 'sacador')).toBe('direcao');
  });

  it('golpe sem efeito (passada + erro) -> direção', () => {
    const prev = form({ situacao: 'passada', tipo: 'erro_nao_forcado' });
    const curr = form({ situacao: 'passada', tipo: 'erro_nao_forcado', golpe: 'vfh' });
    expect(getNextStep(prev, curr, 'sacador')).toBe('direcao');
  });

  it('direção -> duração quando não há golpe especial', () => {
    const base = { situacao: 'fundo', tipo: 'winner', golpe: 'fh', efeito: 'flat' } as const;
    expect(getNextStep(form(base), form({ ...base, direcao: 'cruzada' }), 'sacador')).toBe('duracao');
  });

  it('direção -> golpe especial quando existem opções', () => {
    const base = { situacao: 'fundo', tipo: 'winner', golpe: 'fh', efeito: 'topspin' } as const;
    expect(isStepVisible('golpeEsp', form({ ...base, direcao: 'cruzada' }), 'sacador')).toBe(true);
    expect(getNextStep(form(base), form({ ...base, direcao: 'cruzada' }), 'sacador')).toBe('golpeEsp');
  });

  it('última etapa (duração) -> null', () => {
    const base = { situacao: 'fundo', tipo: 'winner', golpe: 'fh', efeito: 'flat', direcao: 'cruzada' } as const;
    expect(getNextStep(form(base), form({ ...base, duracao: 'opcao_1' }), 'sacador')).toBeNull();
  });

  it('pula etapas já preenchidas', () => {
    const base = { situacao: 'fundo', tipo: 'winner', golpe: 'fh', efeito: 'flat', duracao: 'opcao_1' } as const;
    expect(getNextStep(form(base), form({ ...base, direcao: 'cruzada' }), 'sacador')).toBeNull();
  });

  it('devolução de saque não pede duração', () => {
    const prev = form({ situacao: 'devolucao', tipo: 'erro_nao_forcado' });
    expect(isStepVisible('duracao', form({ situacao: 'devolucao', tipo: 'erro_nao_forcado', golpe: 'fh' }), 'sacador')).toBe(false);
    expect(getNextStep(prev, form({ situacao: 'devolucao', tipo: 'erro_nao_forcado', golpe: 'fh' }), 'sacador')).toBe('efeito');
  });
});

describe('computeScrollTop', () => {
  const container = { top: 100, bottom: 500 };

  it('alvo totalmente visível -> null', () => {
    expect(computeScrollTop(container, 0, { top: 200, bottom: 300 })).toBeNull();
  });

  it('alvo abaixo da dobra -> scrollTop que o leva ao topo', () => {
    expect(computeScrollTop(container, 50, { top: 550, bottom: 650 }, 12)).toBe(50 + 450 - 12);
  });

  it('alvo acima do topo -> não fica negativo', () => {
    expect(computeScrollTop(container, 5, { top: 90, bottom: 150 }, 12)).toBe(0);
  });
});
