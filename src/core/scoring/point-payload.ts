import type { PointFlow } from './types';

export const POINT_PAYLOAD_KEYS = [
  'winnerId',
  'type',
  'serverId',
  'timestamp',
  'sequenceNumber',
  'clientEventId',
  'rallyDetails',
  'rallyLength',
  'isFirstServe',
  'isSecondServe',
  'firstFaultDetail',
] as const;

export type PointPayloadKey = (typeof POINT_PAYLOAD_KEYS)[number];

export interface PointPayload {
  winnerId: string;
  type: string;
  serverId: string;
  timestamp: number;
  sequenceNumber: number;
  clientEventId: string;
  rallyDetails?: PointFlow['rallyDetails'];
  rallyLength?: number;
  isFirstServe?: boolean;
  isSecondServe?: boolean;
  firstFaultDetail?: PointFlow['firstFaultDetail'];
}

export function buildPointPayload(
  flow: PointFlow,
  sequenceNumber: number,
  clientEventId?: string,
): PointPayload {
  return {
    winnerId: flow.winnerId,
    type: flow.type,
    serverId: flow.serverId,
    timestamp: flow.timestamp ?? Date.now(),
    sequenceNumber,
    clientEventId:
      clientEventId ??
      flow.clientEventId ??
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`),
    rallyDetails: flow.rallyDetails ?? undefined,
    rallyLength: flow.rallyLength ?? undefined,
    isFirstServe: flow.isFirstServe ?? undefined,
    isSecondServe: flow.isSecondServe ?? undefined,
    firstFaultDetail: flow.firstFaultDetail ?? undefined,
  };
}
