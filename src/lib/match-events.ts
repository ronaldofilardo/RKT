import { EventEmitter } from 'events';

export type MatchEventType = 'point_scored' | 'state_changed' | 'session_updated';

export interface MatchEvent {
  type: MatchEventType;
  matchId: string;
  data: unknown;
  timestamp: number;
}

const emitter = new EventEmitter();
emitter.setMaxListeners(200);

export function emitMatchEvent(matchId: string, type: MatchEventType, data: unknown) {
  const event: MatchEvent = { type, matchId, data, timestamp: Date.now() };
  emitter.emit(matchId, event);
}

export function subscribeMatch(matchId: string, handler: (event: MatchEvent) => void): () => void {
  emitter.on(matchId, handler);
  return () => { emitter.off(matchId, handler); };
}
