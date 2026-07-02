export const TENNIS_FORMATS = [
  { value: 'BEST_OF_3', label: 'Melhor de 3 Sets - Com vantagem', hint: '3º set inteiro | Padrão ITF/ATP/WTA' },
  { value: 'BEST_OF_3_MATCH_TB', label: 'Melhor de 3 sets - Tie-break no 3º', hint: 'Match TB no 3º set | Juvenil e classes' },
  { value: 'BEST_OF_3_NO_AD', label: 'Melhor de 3 sets - No-Ad', hint: 'Sem vantagem | Duplas ATP/Classes' },
  { value: 'BEST_OF_5', label: 'Melhor de 5 Sets (Grand Slam)', hint: '5º set inteiro + TB 10pts | Grand Slams' },
  { value: 'SHORT_SET_2V2_NO_AD', label: 'Sets curtos 2/2 - No-Ad', hint: 'Kids Bola Laranja/verde | 8-10 anos' },
  { value: 'MATCH_TB_10', label: 'Match Tie-break', hint: 'Game único | Kids Bola Vermelha U8' },
  { value: 'PRO_SET_8', label: 'Set profissional até 8', hint: 'TB em 7/7 vai a 9 | Organizadores' },
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