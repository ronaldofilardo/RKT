const FORMAT_LABELS: Record<string, string> = {
  BEST_OF_3: 'Melhor de 3 sets com vantagem',
  BEST_OF_3_MATCH_TB: 'Melhor de 3 sets com vantagem e Match Tie break (MT)',
  BEST_OF_5: 'Melhor de 5 sets (Grand Slam)',
  BEST_OF_3_NO_AD: 'Melhor de 3 sets "no ad"',
  SHORT_SET_2V2_NO_AD: 'Melhor de 3 sets "no ad" e placar inicia em 2/2 e MT',
  PRO_SET_8: 'Set profissional até 8 games com vantagem',
  MATCH_TB_10: 'Match Tie break',
};

export function getFormatLabel(format: string): string {
  return FORMAT_LABELS[format] || format;
}