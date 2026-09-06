export const FORMAT_LABELS: Record<string, string> = {
  BEST_OF_3: 'Melhor de 3 Sets',
  BEST_OF_3_MATCH_TB: 'Melhor de 3 - TB 3º',
  BEST_OF_5: 'Melhor de 5 Sets',
  BEST_OF_3_NO_AD: 'Melhor de 3 - No Ad',
  SHORT_SET_2V2_NO_AD: 'Sets Curtos 2/2',
  MATCH_TB_10: 'Match Tie-break',
  PRO_SET_8: 'Set Profissional 8',
};

export function getFormatLabel(format: string): string {
  return FORMAT_LABELS[format] || format;
}