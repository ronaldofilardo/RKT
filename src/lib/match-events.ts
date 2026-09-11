import { EventEmitter } from 'events';

export type MatchEventType = 'point_scored' | 'state_changed' | 'session_updated';

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  matchId: string;
  data: unknown;
  timestamp: number;
}

const emitter = new EventEmitter();
emitter.setMaxListeners(200);

const MAX_BUFFERED_EVENTS = 50;
const eventBuffers = new Map<string, MatchEvent[]>();
let eventSeq = 0;

export function emitMatchEvent(matchId: string, type: MatchEventType, data: unknown) {
  eventSeq += 1;
  const event: MatchEvent = {
    id: `${Date.now()}-${eventSeq}`,
    type,
    matchId,
    data,
    timestamp: Date.now(),
  };

  let buffer = eventBuffers.get(matchId);
  if (!buffer) {
    buffer = [];
    eventBuffers.set(matchId, buffer);
  }
  buffer.push(event);
  if (buffer.length > MAX_BUFFERED_EVENTS) {
    buffer.shift();
  }

  emitter.emit(matchId, event);
}

export function getMissedEvents(matchId: string, lastEventId?: string | null): MatchEvent[] {
  if (!lastEventId) return [];
  const buffer = eventBuffers.get(matchId);
  if (!buffer || buffer.length === 0) return [];
  const idx = buffer.findIndex((e) => e.id === lastEventId);
  if (idx === -1) {
    return [...buffer];
  }
  return buffer.slice(idx + 1);
}

export function subscribeMatch(matchId: string, handler: (event: MatchEvent) => void): () => void {
  emitter.on(matchId, handler);
  return () => { emitter.off(matchId, handler); };
}
