import { POINT_PAYLOAD_KEYS, buildPointPayload } from '../point-payload';
import { PointFlowInputSchema } from '@/schemas/rally';
import { buildAnnotationsPayload } from '@/app/api/matches/[id]/point/route.logic';
import type { PointFlow } from '../types';

describe('Point Payload & Flow Contract', () => {
  const sampleFlow: PointFlow = {
    winnerId: '11111111-1111-4111-8111-111111111111',
    type: 'ACE',
    serverId: '11111111-1111-4111-8111-111111111111',
    timestamp: 1700000000000,
    isFirstServe: true,
    isSecondServe: false,
    firstFault: false,
    rallyLength: 1,
    rallyDetails: {
      vencedor: 'sacador',
      situacao: 'saque',
      tipo: 'winner',
      golpe: 'saque',
      previewBalls: 1,
    },
    firstFaultDetail: {
      errorType: 'net',
      direction: 'centro',
    },
    clientEventId: 'evt-12345',
  };

  it('buildPointPayload extrai e mapeia todas as chaves canônicas de POINT_PAYLOAD_KEYS', () => {
    const payload = buildPointPayload(sampleFlow, 42, sampleFlow.clientEventId);

    for (const key of POINT_PAYLOAD_KEYS) {
      expect(payload).toHaveProperty(key);
      expect((payload as Record<string, unknown>)[key]).toBeDefined();
    }
  });

  it('PointFlowInputSchema valida o payload gerado por buildPointPayload', () => {
    const payload = buildPointPayload(sampleFlow, 1, 'event-1');
    const parseResult = PointFlowInputSchema.safeParse(payload);
    expect(parseResult.success).toBe(true);
  });

  it('todo campo de PointFlow é contemplado ou no payload de rede ou em annotations do PointLog', () => {
    // Chaves de PointFlow conhecidas
    const pointFlowKeys: (keyof PointFlow)[] = [
      'winnerId',
      'type',
      'serverId',
      'timestamp',
      'isFirstServe',
      'isSecondServe',
      'firstFault',
      'rallyDetails',
      'rallyLength',
      'firstFaultDetail',
      'clientEventId',
    ];

    const payload = buildPointPayload(sampleFlow, 10, sampleFlow.clientEventId);
    const parsed = PointFlowInputSchema.parse(payload);
    const annotations = buildAnnotationsPayload(parsed);

    // Colunas de PointLog no Prisma
    const pointLogColumns = new Set([
      'winnerId',
      'type',
      'serverId',
      'timestamp',
      'sequenceNumber',
      'clientEventId',
    ]);

    for (const key of pointFlowKeys) {
      if (key === 'firstFault') {
        // firstFault é booleano derivado de isSecondServe / firstFaultDetail
        continue;
      }
      const coveredByColumn = pointLogColumns.has(key);
      const coveredByAnnotations = key in annotations;
      expect(
        coveredByColumn || coveredByAnnotations,
      ).toBe(true);
    }
  });
});
