export const TENNIS_FORMATS = [
  { value: 'BEST_OF_3', label: 'Melhor de 3 Sets - Com vantagem', hint: '2 sets para vencer | 6 games com tie-break em 6/6 | 3º set inteiro com vantagem | Padrão ITF/ATP/WTA' },
  { value: 'BEST_OF_3_MATCH_TB', label: 'Melhor de 3 sets - Tie-break no 3º', hint: '2 sets para vencer | 6 games com tie-break em 6/6 | 3º set é Match Tie-Break de 10 pontos | Juvenil e classes' },
  { value: 'BEST_OF_5', label: 'Melhor de 5 Sets (Grand Slam)', hint: '3 sets para vencer | 6 games com tie-break em 6/6 | 5º set inteiro com tie-break de 10 pontos | Grand Slams' },
  { value: 'SHORT_SET_2V2_NO_AD', label: 'Sets curtos 2/2 - No-Ad', hint: '2 sets para vencer | 4 games com tie-break em 4/4 | Sem vantagem | 3º set é Match Tie-Break de 10 pontos | Kids Bola Laranja/Verde (8-10 anos)' },
  { value: 'MATCH_TB_10', label: 'Match Tie-break', hint: 'Game único de 10 pontos (primeiro a 10, diferença de 2) | Kids Bola Vermelha U8' },
  { value: 'PRO_SET_8', label: 'Set profissional até 8', hint: '1 set para vencer | 8 games com tie-break em 7/7 (vai a 9) | Organizadores' },
];

export const COURT_TYPES = [
  { value: 'CLAY', label: 'Saibro', color: '#c4623a', icon: '🟤', note: 'Roland Garros' },
  { value: 'HARD', label: 'Dura', color: '#3b82f6', icon: '🔵', note: 'US Open' },
  { value: 'GRASS', label: 'Grama', color: '#16a34a', icon: '🟢', note: 'Wimbledon' },
];

export const SPORT_TYPES = [
  { value: 'TENNIS', label: 'Tênis' },
  { value: 'BADMINTON', label: 'Badminton' },
  { value: 'TABLE_TENNIS', label: 'Tênis de Mesa' },
  { value: 'VOLLEYBALL', label: 'Vôlei' },
];

export const BRACKET_TYPES = [
  { value: 'ELIMINATION', label: 'Eliminação Direta' },
  { value: 'GROUPS', label: 'Grupos' },
  { value: 'SWISS', label: 'Suíço' },
];

export const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: 'Pública' },
  { value: 'PLAYERS_ONLY', label: 'Apenas Jogadores' },
];