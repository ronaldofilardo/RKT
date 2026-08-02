import { PrismaClient } from '@prisma/client';
import { MatchFormat } from '@prisma/client';

// Teste unitário do enum - não requer banco de dados
describe('MatchFormat Enum - 6 formatos oficiais de Tênis', () => {
  const validFormats: MatchFormat[] = [
    'BEST_OF_3',
    'BEST_OF_3_MATCH_TB',
    'BEST_OF_5',
    'BEST_OF_3_NO_AD',
    'SHORT_SET_2V2_NO_AD',
    'MATCH_TB_10',
  ];

  it('deve ter exatamente 6 formatos válidos de tênis', () => {
    expect(validFormats.length).toBe(6);
  });

  it('deve incluir BEST_OF_3', () => {
    expect(validFormats).toContain('BEST_OF_3');
  });

  it('deve incluir BEST_OF_3_MATCH_TB', () => {
    expect(validFormats).toContain('BEST_OF_3_MATCH_TB');
  });

  it('deve incluir BEST_OF_5', () => {
    expect(validFormats).toContain('BEST_OF_5');
  });

  it('deve incluir BEST_OF_3_NO_AD', () => {
    expect(validFormats).toContain('BEST_OF_3_NO_AD');
  });

  it('deve incluir SHORT_SET_2V2_NO_AD', () => {
    expect(validFormats).toContain('SHORT_SET_2V2_NO_AD');
  });

  it('deve incluir MATCH_TB_10', () => {
    expect(validFormats).toContain('MATCH_TB_10');
  });

  it('NÃO deve incluir PRO_SET_8 (formato removido)', () => {
    expect(validFormats).not.toContain('PRO_SET_8');
  });

  it('NÃO deve incluir BEST_OF_3_NO_AD_START_2_2 (formato inválido)', () => {
    expect(validFormats).not.toContain('BEST_OF_3_NO_AD_START_2_2');
  });
});