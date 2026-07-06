import {
  formReducer,
  initialForm,
  getTipoOptions,
  getGolpeOptions,
  shouldShowSubtipo1,
  shouldShowSubtipo2,
  shouldShowEfeito,
  getDirecaoOptions,
  getGolpeEspOptions,
  SITUACAO_OPTIONS,
  TIPO_LABELS,
  TIPO_DESCRIPTIONS,
  GOLPE_LABELS,
  SUBTIPO1_OPTIONS,
  SUBTIPO2_OPTIONS,
  EFEITO_OPTIONS,
  DIRECAO_LABELS,
  GOLPE_ESP_LABELS,
} from '../point-details-logic';
import type { PointDetailsForm, Action, Vencedor } from '../point-details-logic';

describe('point-details-logic', () => {
  describe('formReducer', () => {
    it('deve retornar initialForm no RESET', () => {
      const dirty: PointDetailsForm = { ...initialForm, situacao: 'fundo' };
      const next = formReducer(dirty, { type: 'RESET' });
      expect(next).toEqual(initialForm);
    });

    it('deve limpar cascata ao mudar tipo', () => {
      const state: PointDetailsForm = {
        ...initialForm,
        situacao: 'fundo',
        tipo: 'winner',
        golpe: 'fh',
        subtipo1: 'passing_shot',
        subtipo2: 'out',
        efeito: 'topspin',
        direcao: 'cruzada',
        golpeEsp: 'lob',
      };
      const next = formReducer(state, { type: 'SET_TIPO', value: 'erro_forcado' });
      expect(next.tipo).toBe('erro_forcado');
      expect(next.golpe).toBeNull();
      expect(next.subtipo1).toBeNull();
      expect(next.subtipo2).toBeNull();
      expect(next.efeito).toBeNull();
      expect(next.direcao).toBeNull();
      expect(next.golpeEsp).toBeNull();
    });
  });

  describe('getTipoOptions', () => {
    it('sacador na devolucao retorna apenas erros', () => {
      expect(getTipoOptions('sacador', 'devolucao')).toEqual(['erro_nao_forcado', 'erro_forcado']);
    });

    it('devolvedor na devolucao retorna apenas winner', () => {
      expect(getTipoOptions('devolvedor', 'devolucao')).toEqual(['winner']);
    });

    it('outras situacoes retornam todos os tipos', () => {
      expect(getTipoOptions('sacador', 'fundo')).toEqual(['erro_nao_forcado', 'erro_forcado', 'winner']);
      expect(getTipoOptions('devolvedor', 'passada')).toEqual(['erro_nao_forcado', 'erro_forcado', 'winner']);
    });
  });

  describe('getGolpeOptions', () => {
    it('sacador em fundo/devolucao retorna FH/BH', () => {
      expect(getGolpeOptions('sacador', 'fundo', 'winner')).toEqual(['fh', 'bh']);
      expect(getGolpeOptions('sacador', 'devolucao', 'erro_forcado')).toEqual(['fh', 'bh']);
    });

    it('sacador em passada winner retorna FH/BH', () => {
      expect(getGolpeOptions('sacador', 'passada', 'winner')).toEqual(['fh', 'bh']);
    });

    it('sacador em passada erro retorna voleios e smash', () => {
      expect(getGolpeOptions('sacador', 'passada', 'erro_forcado')).toEqual(['vfh', 'vbh', 'smash']);
    });

    it('devolvedor em fundo/devolucao retorna FH/BH', () => {
      expect(getGolpeOptions('devolvedor', 'fundo', 'winner')).toEqual(['fh', 'bh']);
      expect(getGolpeOptions('devolvedor', 'devolucao', 'erro_forcado')).toEqual(['fh', 'bh']);
    });

    it('padrao retorna FH/BH', () => {
      expect(getGolpeOptions('sacador', 'rede', 'erro_forcado')).toEqual(['fh', 'bh']);
    });
  });

  describe('shouldShowSubtipo1', () => {
    it('somente sacador, rede, erro-forcado (nao winner)', () => {
      expect(shouldShowSubtipo1('sacador', 'rede', 'erro_forcado')).toBe(true);
      expect(shouldShowSubtipo1('sacador', 'rede', 'winner')).toBe(false);
      expect(shouldShowSubtipo1('devolvedor', 'rede', 'erro_forcado')).toBe(false);
      expect(shouldShowSubtipo1('sacador', 'fundo', 'erro_forcado')).toBe(false);
    });
  });

  describe('shouldShowSubtipo2', () => {
    it('somente quando passada, erro e golpe de aproximacao/smash', () => {
      expect(shouldShowSubtipo2('passada', 'erro_forcado', 'vbh')).toBe(true);
      expect(shouldShowSubtipo2('passada', 'erro_forcado', 'vfh')).toBe(true);
      expect(shouldShowSubtipo2('passada', 'erro_forcado', 'smash')).toBe(true);
      expect(shouldShowSubtipo2('passada', 'winner', 'vbh')).toBe(false);
      expect(shouldShowSubtipo2('fundo', 'erro_forcado', 'vbh')).toBe(false);
      expect(shouldShowSubtipo2('passada', 'erro_forcado', 'fh')).toBe(false);
    });
  });

  describe('shouldShowEfeito', () => {
    it('esconde efeito em passada erro e rede winner', () => {
      expect(shouldShowEfeito('sacador', 'passada', 'erro_forcado', false, false)).toBe(false);
      expect(shouldShowEfeito('devolvedor', 'rede', 'winner', false, false)).toBe(false);
      expect(shouldShowEfeito('sacador', 'fundo', 'winner', false, false)).toBe(true);
    });
  });

  describe('getDirecaoOptions', () => {
    it('slice retorna apenas 3 opcoes', () => {
      expect(getDirecaoOptions('slice', 'fundo', 'winner')).toEqual(['cruzada', 'paralela', 'centro']);
    });

    it('passada erro e rede winner retornam 3 opcoes', () => {
      expect(getDirecaoOptions(null, 'passada', 'erro_forcado')).toEqual(['cruzada', 'paralela', 'centro']);
      expect(getDirecaoOptions(null, 'rede', 'winner')).toEqual(['cruzada', 'paralela', 'centro']);
    });

    it('padrao retorna 5 opcoes', () => {
      expect(getDirecaoOptions('topspin', 'fundo', 'winner')).toEqual([
        'cruzada',
        'paralela',
        'centro',
        'inside_out',
        'inside_in',
      ]);
    });
  });

  describe('getGolpeEspOptions', () => {
    it('smash nunca tem golpe especial', () => {
      expect(getGolpeEspOptions('smash', null, 'sacador', 'fundo', 'winner', null, null)).toEqual([]);
    });

    it('flat nunca tem golpe especial', () => {
      expect(getGolpeEspOptions('fh', 'flat', 'sacador', 'fundo', 'winner', null, null)).toEqual([]);
    });

    it('slice tem lob e drop', () => {
      expect(getGolpeEspOptions('fh', 'slice', 'sacador', 'fundo', 'winner', null, null)).toEqual(['lob', 'drop_shot']);
      expect(getGolpeEspOptions('vfh', 'slice', 'devolvedor', 'fundo', 'winner', null, null)).toEqual(['lob', 'drop_shot']);
    });

    it('devolvedor com vbh/vfh sem efeito tem 3 opcoes', () => {
      expect(getGolpeEspOptions('vbh', null, 'devolvedor', 'fundo', 'winner', null, null)).toEqual([
        'drop_shot',
        'bate_pronto',
        'swing_volley',
      ]);
    });

    it('topspin winner tem apenas lob', () => {
      expect(getGolpeEspOptions('fh', 'topspin', 'sacador', 'fundo', 'winner', null, null)).toEqual(['lob']);
    });

    it('topspin devolvedor fundo nao tem opcoes', () => {
      expect(getGolpeEspOptions('fh', 'topspin', 'devolvedor', 'fundo', 'erro_forcado', null, null)).toEqual([]);
    });

    it('sacador fundo topspin tem 2 opcoes', () => {
      expect(getGolpeEspOptions('fh', 'topspin', 'sacador', 'fundo', 'erro_forcado', null, null)).toEqual([
        'lob',
        'bate_pronto',
      ]);
    });
  });

  describe('labels e options', () => {
    it('SITUACAO_OPTIONS deve ter 4 opcoes', () => {
      expect(SITUACAO_OPTIONS).toHaveLength(4);
      expect(SITUACAO_OPTIONS.map(o => o.value)).toEqual(['devolucao', 'fundo', 'passada', 'rede']);
    });

    it('TIPO_LABELS deve mapear todos os tipos', () => {
      expect(TIPO_LABELS.winner).toBe('Winner');
      expect(TIPO_LABELS.erro_nao_forcado).toBe('Erro Não Forçado');
      expect(TIPO_LABELS.erro_forcado).toBe('Erro Forçado');
    });

    it('TIPO_DESCRIPTIONS deve ter descricao para cada tipo', () => {
      expect(TIPO_DESCRIPTIONS.winner).toContain('bola ganhadora');
      expect(TIPO_DESCRIPTIONS.erro_nao_forcado).toContain('pressão');
      expect(TIPO_DESCRIPTIONS.erro_forcado).toContain('pressão');
    });

    it('GOLPE_LABELS deve mapear todos os golpes', () => {
      expect(GOLPE_LABELS.fh).toBe('Forehand (FH)');
      expect(GOLPE_LABELS.bh).toBe('Backhand (BH)');
      expect(GOLPE_LABELS.vfh).toBe('Voleio FH');
      expect(GOLPE_LABELS.vbh).toBe('Voleio BH');
      expect(GOLPE_LABELS.smash).toBe('Smash');
    });

    it('SUBTIPO1_OPTIONS deve ter 2 opcoes', () => {
      expect(SUBTIPO1_OPTIONS).toHaveLength(2);
    });

    it('SUBTIPO2_OPTIONS deve ter 2 opcoes', () => {
      expect(SUBTIPO2_OPTIONS).toHaveLength(2);
    });

    it('EFEITO_OPTIONS deve ter 3 opcoes', () => {
      expect(EFEITO_OPTIONS.map(o => o.value)).toEqual(['topspin', 'slice', 'flat']);
    });

    it('DIRECAO_LABELS deve mapear todas as direcoes', () => {
      expect(DIRECAO_LABELS.cruzada).toBe('Cruzada');
      expect(DIRECAO_LABELS.paralela).toBe('Paralela');
      expect(DIRECAO_LABELS.centro).toBe('Centro');
      expect(DIRECAO_LABELS.inside_out).toBe('Inside-out');
      expect(DIRECAO_LABELS.inside_in).toBe('Inside-in');
    });

    it('GOLPE_ESP_LABELS deve mapear todos os golpes especiais', () => {
      expect(GOLPE_ESP_LABELS.lob).toBe('Lob');
      expect(GOLPE_ESP_LABELS.drop_shot).toBe('Drop Shot');
      expect(GOLPE_ESP_LABELS.bate_pronto).toBe('Bate-pronto');
      expect(GOLPE_ESP_LABELS.swing_volley).toBe('Swing Volley');
    });
  });
});
