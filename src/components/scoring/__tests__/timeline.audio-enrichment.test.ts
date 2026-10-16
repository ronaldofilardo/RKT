import { enrichTimelineWithAudio, type PointLogAudioMeta } from '../timeline.logic';
import type { TimelinePoint } from '@/core/scoring/types';

describe('enrichTimelineWithAudio - Caracterização e Regressão de Áudio', () => {
  const basePoint: TimelinePoint = {
    pointNumber: 1,
    winner: 'PLAYER_1',
    type: 'WINNER',
    server: 'player1',
    isFirstServe: true,
    isSecondServe: false,
    gameScore: '15-0',
    gamesScore: '0-0',
    setNumber: 1,
    isBreakPoint: false,
    isGameBall: false,
    isSetBall: false,
  };

  it('enriquece pontos locais associando pointId, hasAudioNote e audioNoteDuration', () => {
    const points: TimelinePoint[] = [
      { ...basePoint, pointNumber: 1 },
      { ...basePoint, pointNumber: 2 },
    ];

    const audioMeta: PointLogAudioMeta[] = [
      { pointLogId: 'pl-1', hasAudioNote: true, audioNoteDuration: 4500 },
      { pointLogId: 'pl-2', hasAudioNote: false, audioNoteDuration: null },
    ];

    const result = enrichTimelineWithAudio(points, audioMeta);

    expect(result[0].pointId).toBe('pl-1');
    expect(result[0].hasAudioNote).toBe(true);
    expect(result[0].audioNoteDuration).toBe(4500);

    expect(result[1].pointId).toBe('pl-2');
    expect(result[1].hasAudioNote).toBe(false);
  });

  it('enriquece por pointId imutável quando o ponto já possui pointId (pontos do servidor)', () => {
    // Simula pontos que vieram do servidor, onde o point 2 tem áudio
    const serverPoints: TimelinePoint[] = [
      { ...basePoint, pointNumber: 1, pointId: 'server-pt-1' },
      { ...basePoint, pointNumber: 2, pointId: 'server-pt-2' },
    ];

    // Array de metadados em ordem inversa ou divergente de índice
    const audioMeta: PointLogAudioMeta[] = [
      { pointLogId: 'server-pt-2', hasAudioNote: true, audioNoteDuration: 3000 },
      { pointLogId: 'server-pt-1', hasAudioNote: false, audioNoteDuration: null },
    ];

    const result = enrichTimelineWithAudio(serverPoints, audioMeta);

    // Deve associar pelo pointId e encontrar o áudio no ponto 2 mesmo com ordem diferente
    const pt2 = result.find(p => p.pointId === 'server-pt-2');
    expect(pt2?.hasAudioNote).toBe(true);
    expect(pt2?.audioNoteDuration).toBe(3000);
  });

  it('mantém o enriquecimento correto mesmo quando existem quebras visuais (segmentBreak)', () => {
    // Simula a timeline do servidor com um card decorativo de quebra entre os pontos
    const pointsWithBreak: TimelinePoint[] = [
      { ...basePoint, pointNumber: 1, pointId: 'pt-log-1' },
      {
        ...basePoint,
        pointNumber: 0,
        segmentBreak: {
          setNumber: 1,
          scoreLabel: '1-0',
          breakType: 'game',
        },
      },
      { ...basePoint, pointNumber: 2, pointId: 'pt-log-2' },
    ];

    const audioMeta: PointLogAudioMeta[] = [
      { pointLogId: 'pt-log-1', hasAudioNote: false, audioNoteDuration: null },
      { pointLogId: 'pt-log-2', hasAudioNote: true, audioNoteDuration: 5200 },
    ];

    const result = enrichTimelineWithAudio(pointsWithBreak, audioMeta);

    // O ponto de índice 2 (pt-log-2) não pode pegar meta do índice 2 inexistente ou incorreto
    expect(result[2].pointId).toBe('pt-log-2');
    expect(result[2].hasAudioNote).toBe(true);
    expect(result[2].audioNoteDuration).toBe(5200);
  });

  it('não perde hasAudioNote pré-existente se a lista de metadados estiver vazia', () => {
    const pointsAlreadyEnriched: TimelinePoint[] = [
      { ...basePoint, pointNumber: 1, pointId: 'pt-1', hasAudioNote: true, audioNoteDuration: 2000 },
    ];

    const result = enrichTimelineWithAudio(pointsAlreadyEnriched, []);

    expect(result[0].hasAudioNote).toBe(true);
    expect(result[0].pointId).toBe('pt-1');
  });
});
