import type { TimelinePoint } from '@/core/scoring/types';
import { buildReportCsv } from '../report-export';
import type { ReportData } from '../report.types';

const point: TimelinePoint = {
  pointNumber: 1,
  winner: 'PLAYER_1',
  type: 'WINNER',
  server: 'player1',
  isFirstServe: true,
  isSecondServe: false,
  gameScore: { player1: 40, player2: 30 },
  gamesScore: { player1: 5, player2: 4 },
  setNumber: 1,
  isBreakPoint: true,
  isGameBall: false,
  isSetBall: false,
  rallyLength: 9,
  rallyDetails: null,
  note: 'observação do scout',
  zone: 'aberto',
  stroke: 'forehand',
  rawAnnotations: {
    sequenceNumber: 1,
    winnerId: 'player-1',
    serverId: 'player-1',
    type: 'WINNER',
    isFirstServe: true,
    isSecondServe: false,
    firstFaultDetail: { errorType: 'rede', serveEffect: 'slice', direction: 'aberto' },
    golpe: 'forehand',
    efeito: 'topspin',
    direcao: 'paralela',
    zone: 'aberto',
    duracao: 'longa',
    rallyLength: 9,
    note: 'observação do scout',
    audioNoteDuration: 12,
  },
  hasAudioNote: true,
  audioNoteDuration: 12,
  audioNoteMime: 'audio/webm',
  pointId: 'point-1',
  isTiebreak: false,
  gameIsDeuce: false,
  gameAdvantage: null,
  serveEffect: 'slice',
  serveDirection: 'aberto',
  firstFault: { errorType: 'rede', serveEffect: 'slice', direction: 'aberto' },
  pointDetails: {
    winnerId: 'player-1',
    type: 'WINNER',
    isFirstServe: true,
    isSecondServe: false,
    isLet: false,
    serverId: 'player-1',
    timestamp: 1000,
    rallyDetails: null,
    rallyLength: 9,
    firstFaultDetail: { errorType: 'rede', serveEffect: 'slice', direction: 'aberto' },
  },
};

const report = { matchId: 'match-1', timelinePoints: [point] } as ReportData;

describe('cobertura dos campos do relatório e exportação', () => {
  it('mantém todos os campos brutos da anotação no ponto exportável', () => {
    const csv = buildReportCsv(report);
    const expectedHeaders = ['ponto', 'set', 'games', 'pontos', 'vencedor', 'tipo', 'sacador', 'golpe', 'efeito', 'direcao', 'zona', 'rally_length', 'nota', 'audio', 'anotacoes_json'];
    expectedHeaders.forEach((header) => expect(csv).toContain(header));
    ['observação do scout', 'aberto', 'forehand', 'slice', '9', 'sim', 'audioNoteDuration'].forEach((value) => expect(csv).toContain(value));
    expect(csv).toContain('sequenceNumber');
    expect(csv).toContain('winnerId');
    expect(csv).toContain('serverId');
    expect(csv).toContain('firstFaultDetail');
  });

  it('exporta áudio, duração e JSON bruto sem perder aspas', () => {
    const escapedPoint = { ...point, note: 'nota com "aspas"' };
    const csv = buildReportCsv({ ...report, timelinePoints: [escapedPoint] });
    expect(csv).toContain('"nota com ""aspas"""');
    expect(csv).toContain('12');
    expect(csv).toContain('audio/webm');
  });
});
