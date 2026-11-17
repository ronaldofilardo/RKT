/**
 * getPlayerInitials — regra de formatação das colunas SAC e Venc.
 * Split de timeline-rows.test.tsx (asserções 1:1).
 */
import { getPlayerInitials } from '../timeline-rows';

describe('getPlayerInitials', () => {
  it('nome + sobrenome: usa a inicial de cada um, ex. "Rafael Nadal" → "R.N."', () => {
    expect(getPlayerInitials('Rafael Nadal')).toBe('R.N.');
  });

  it('nome com mais de 2 palavras: usa a inicial da primeira e da última', () => {
    expect(getPlayerInitials('Roger Federer Junior')).toBe('R.J.');
  });

  it('nome único: usa as 3 primeiras letras capitalizadas, ex. "Djokovic" → "Djo"', () => {
    expect(getPlayerInitials('Djokovic')).toBe('Djo');
  });

  it('nome único curto: mantém como está, capitalizado', () => {
    expect(getPlayerInitials('Ana')).toBe('Ana');
  });
});
