import { pointLogToFlow } from '../timeline-rebuild.helpers';
import type { PointLogRow } from '../timeline-rebuild';

describe('pointLogToFlow', () => {
  it('identifies DOUBLE_FAULT as second serve', () => {
    const log: PointLogRow = {
      id: '1',
      winnerId: 'p2',
      type: 'DOUBLE_FAULT',
      serverId: 'p1',
      timestamp: new Date(),
      sequenceNumber: 1,
      clientEventId: null,
      annotations: null,
      audioNote: null,
      audioNoteMime: null,
      audioNoteDuration: null,
    };
    const flow = pointLogToFlow(log);
    expect(flow.isSecondServe).toBe(true);
    expect(flow.isFirstServe).toBe(false);
    expect(flow.firstFault).toBe(false);
  });

  it('identifies FAULT_FIRST and handles first serve correctly', () => {
    const log: PointLogRow = {
      id: '2',
      winnerId: 'p2',
      type: 'FAULT_FIRST',
      serverId: 'p1',
      timestamp: new Date(),
      sequenceNumber: 2,
      clientEventId: null,
      annotations: null,
      audioNote: null,
      audioNoteMime: null,
      audioNoteDuration: null,
    };
    const flow = pointLogToFlow(log);
    expect(flow.isSecondServe).toBe(false);
    expect(flow.isFirstServe).toBe(true);
    expect(flow.firstFault).toBe(true);
  });

  it('uses annotations to determine second serve when available', () => {
    const log: PointLogRow = {
      id: '3',
      winnerId: 'p1',
      type: 'WINNER',
      serverId: 'p1',
      timestamp: new Date(),
      sequenceNumber: 3,
      clientEventId: null,
      annotations: {
        isSecondServe: true
      },
      audioNote: null,
      audioNoteMime: null,
      audioNoteDuration: null,
    };
    const flow = pointLogToFlow(log);
    expect(flow.isSecondServe).toBe(true);
    expect(flow.isFirstServe).toBe(false);
  });

  it('uses firstFaultDetail to determine second serve', () => {
    const log: PointLogRow = {
      id: '4',
      winnerId: 'p1',
      type: 'WINNER',
      serverId: 'p1',
      timestamp: new Date(),
      sequenceNumber: 4,
      clientEventId: null,
      annotations: {
        firstFaultDetail: { errorType: 'net' }
      },
      audioNote: null,
      audioNoteMime: null,
      audioNoteDuration: null,
    };
    const flow = pointLogToFlow(log);
    expect(flow.isSecondServe).toBe(true);
    expect(flow.isFirstServe).toBe(false);
    expect(flow.firstFaultDetail).toEqual({ errorType: 'net' });
  });

  it('includes rallyDetails and rallyLength', () => {
    const log: PointLogRow = {
      id: '5',
      winnerId: 'p1',
      type: 'WINNER',
      serverId: 'p1',
      timestamp: new Date(),
      sequenceNumber: 5,
      clientEventId: null,
      annotations: {
        rallyDetails: { tipo: 'winner_fundo', lado: 'forehand' } as any,
        rallyLength: 5
      },
      audioNote: null,
      audioNoteMime: null,
      audioNoteDuration: null,
    };
    const flow = pointLogToFlow(log);
    expect(flow.rallyDetails).toEqual({ tipo: 'winner_fundo', lado: 'forehand' });
    expect(flow.rallyLength).toBe(5);
  });
});
