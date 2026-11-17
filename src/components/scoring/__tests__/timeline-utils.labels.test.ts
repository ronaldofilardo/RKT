/**
 * Split de timeline-utils.test.ts — describe "label functions": mapeamentos
 * de situações, golpes, direções, efeitos, subtipos, tipos e vencedor. Asserções 1:1.
 */
import {
  situacaoLabel,
  golpeLabel,
  direcaoLabel,
  efeitoLabel,
  golpeEspLabel,
  subtipo1Label,
  subtipo2Label,
  tipoLabel,
  vencedorLabel,
} from '../timeline.logic';

describe('label functions', () => {
  it('situacaoLabel deve mapear situações', () => {
    expect(situacaoLabel('devolucao')).toBe('DEV');
    expect(situacaoLabel('fundo')).toBe('FQ');
    expect(situacaoLabel('rede')).toBe('Rede');
    expect(situacaoLabel('passada')).toBe('Pass');
    expect(situacaoLabel('saque')).toBe('Sq');
    expect(situacaoLabel('desconhecida')).toBe('desconhecida');
  });

  it('golpeLabel deve mapear golpes', () => {
    expect(golpeLabel('fh')).toBe('FH');
    expect(golpeLabel('bh')).toBe('BH');
    expect(golpeLabel('vfh')).toBe('VFH');
    expect(golpeLabel('vbh')).toBe('VBH');
    expect(golpeLabel('smash')).toBe('Sm');
    expect(golpeLabel('approach_fh')).toBe('Ap FH');
    expect(golpeLabel('approach_bh')).toBe('Ap BH');
  });

  it('direcaoLabel deve mapear direções', () => {
    expect(direcaoLabel('cruzada')).toBe('X');
    expect(direcaoLabel('paralela')).toBe('Parl');
    expect(direcaoLabel('inside_out')).toBe('In Out');
    expect(direcaoLabel('aberto')).toBe('Ab');
    expect(direcaoLabel('fechado')).toBe('Fe');
    expect(direcaoLabel('centro')).toBe('Ce');
  });

  it('efeitoLabel deve retornar string', () => {
    expect(efeitoLabel('topspin')).toBe('Top');
  });

  it('golpeEspLabel deve mapear golpes especiais', () => {
    expect(golpeEspLabel('lob')).toBe('Lob');
    expect(golpeEspLabel('drop_shot')).toBe('Drop');
    expect(golpeEspLabel('bate_pronto')).toBe('bate-pronto');
  });

  it('subtipo1Label deve mapear subtipos 1', () => {
    expect(subtipo1Label('passing_shot')).toBe('Pass');
    expect(subtipo1Label('devolucao_saque')).toBe('DEV');
  });

  it('subtipo2Label deve mapear subtipos 2', () => {
    expect(subtipo2Label('out')).toBe('out');
    expect(subtipo2Label('net')).toBe('net');
  });

  it('tipoLabel deve mapear tipos', () => {
    expect(tipoLabel('winner')).toBe('W');
    expect(tipoLabel('erro_nao_forcado')).toBe('ENF');
    expect(tipoLabel('erro_forcado')).toBe('EF');
    expect(tipoLabel('dupla_falta')).toBe('DF');
  });

  it('vencedorLabel deve mapear vencedor', () => {
    expect(vencedorLabel('sacador')).toBe('Sacador');
    expect(vencedorLabel('devolvedor')).toBe('Devolvedor');
  });
});
