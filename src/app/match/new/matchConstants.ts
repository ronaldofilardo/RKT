export const TENNIS_FORMATS = [
  { value: 'BEST_OF_3', label: 'Melhor de 3 sets com vantagem', hint: 'Set tie break em todos os sets (7 pts em 6/6). 3º set jogado normal (sem tie break, com vantagem).' },
  { value: 'BEST_OF_3_MATCH_TB', label: 'Melhor de 3 sets com vantagem e Match Tie break (MT)', hint: 'Set tie break nos 2 primeiros sets (7 pts em 6/6). Match Tie break (10 pts) no lugar do 3º set.' },
  { value: 'BEST_OF_5', label: 'Melhor de 5 sets (Grand Slam)', hint: 'Set tie break nos 4 primeiros sets (7 pts em 6/6). 5º set com Match tie break em 6/6 (10 pts).' },
  { value: 'SHORT_SET_2V2_NO_AD', label: 'Melhor de 3 sets "no ad" e placar inicia em 2/2 e MT', hint: 'Set tie break nos 2 primeiros sets (7 pts em 4/4). Match Tie break (10 pts) no lugar do 3º set. Sem vantagem.' },
  { value: 'MATCH_TB_10', label: 'Match Tie break', hint: 'Match tie break único. Vence quem chegar em 10 pontos primeiro (com 2 pts de vantagem em 9/9, 10/10...).' },
  { value: 'PRO_SET_8', label: 'Set profissional até 8 games com vantagem', hint: 'Set único até 8 games. Em 7/7 vai a 9. Set tie break em 8/8 (7 pts, com vantagem em 6/6).' },
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