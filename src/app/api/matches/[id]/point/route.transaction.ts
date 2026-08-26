import { Prisma } from '@prisma/client';
import { ScoringEngine } from '@/core/scoring/engine';
import type { ScoringState, TennisFormat } from '@/core/scoring/types';
import { normalizeScoreState } from '@/core/scoring/score-normalizer';
import { logger } from '@/lib/logger';
import { PointFlowInputSchema } from '@/schemas/contracts';

type PointInput = ReturnType<typeof PointFlowInputSchema.parse>;
type TransactionResult = { scoreState: ScoringState; version: number; pointLogId: string };

export class TransactionError extends Error { constructor(public message: string, public status: number, public code: string = String(status), public extra?: Record<string, unknown>) { super(message); } }

export async function processPointTransaction(tx: Prisma.TransactionClient, id: string, parsed: PointInput): Promise<TransactionResult> {
  const match = await tx.match.findFirst({ where: { id }, include: { player1: true, player2: true } });
  if (!match) { logger.point.matchNotFound(id); throw new TransactionError('Partida não encontrada', 404, 'MATCH_NOT_FOUND'); }
  if (match.state !== 'IN_PROGRESS') { logger.point.matchNotInProgress(match.state); throw new TransactionError('Partida não está em andamento', 422, 'MATCH_NOT_IN_PROGRESS'); }
  if (!match.initialServerId) { logger.point.noInitialServer(); throw new TransactionError('Defina o primeiro sacador antes de pontuar', 422, 'MATCH_NOT_STARTED'); }
  await validateSequence(tx, id, parsed);
  const expectedVersion = match.version;
  const nextVersion = match.version + 1;
  logger.point.engineCreated();
  const engine = createEngine(match, match.scoreState);
  logger.point.applying(parsed);
  const newState = engine.applyPoint(parsed);
  const snapshot = JSON.parse(engine.serialize()) as { state: ScoringState; history: unknown[] };
  const updatedMatch = await tx.match.update({ where: { id, version: expectedVersion }, data: { scoreState: snapshot as unknown as Prisma.InputJsonValue, version: { increment: 1 }, ...(newState.isFinished ? { state: 'FINISHED', finishedAt: new Date() } : {}) } });
  if (updatedMatch.version !== undefined && updatedMatch.version !== nextVersion) {
    throw new TransactionError('Conflito de versão ao persistir o placar', 409, 'VERSION_CONFLICT');
  }
  const annotations = getPointAnnotations(parsed);
  const sequenceNumber = await getNextSequence(tx, id, parsed.sequenceNumber);
  const pointLog = await createPointLog(tx, match.id, parsed, sequenceNumber, annotations);
  logger.point.transactionCompleted();
  logger.point.newStateSets(newState.sets);
  return { scoreState: newState, version: nextVersion, pointLogId: pointLog.id };
}

function getPointAnnotations(parsed: PointInput) {
  return parsed.annotations ?? (parsed.rallyDetails ? { rallyDetails: parsed.rallyDetails, rallyLength: parsed.rallyLength, isFirstServe: parsed.isFirstServe, isSecondServe: parsed.isSecondServe, firstFaultDetail: parsed.firstFaultDetail, note: parsed.rallyDetails.note } : undefined);
}

async function getNextSequence(tx: Prisma.TransactionClient, id: string, received?: number) {
  if (received !== undefined) return received;
  return (await tx.pointLog.count({ where: { matchId: id } })) + 1;
}

async function createPointLog(tx: Prisma.TransactionClient, matchId: string, parsed: PointInput, sequenceNumber: number, annotations: PointInput['annotations']) {
  logger.point.creatingPointLog({ winnerId: parsed.winnerId, type: parsed.type, rallyLength: parsed.rallyLength });
  return tx.pointLog.create({ data: { matchId, winnerId: parsed.winnerId, type: parsed.type, serverId: parsed.serverId, sequenceNumber, annotations } });
}

async function validateSequence(tx: Prisma.TransactionClient, id: string, parsed: PointInput) {
  if (!parsed.sequenceNumber) return;
  const count = await tx.pointLog.count({ where: { matchId: id } });
  if (parsed.sequenceNumber !== count + 1) { logger.point.sequenceConflict({ expected: count + 1, received: parsed.sequenceNumber }); throw new TransactionError(`Conflito de sequência: esperado ${count + 1}, recebido ${parsed.sequenceNumber}`, 409, 'SEQUENCE_CONFLICT', { expectedSequence: count + 1 }); }
}

function createEngine(match: { format: string; player1Id: string; player2Id: string; initialServerId: string | null; scoreState: Prisma.JsonValue | null }, scoreState: Prisma.JsonValue | null) {
  const format = match.format as TennisFormat;
  const config = { format, player1Id: match.player1Id, player2Id: match.player2Id, initialServerId: match.initialServerId as string };
  const normalized = scoreState && typeof scoreState === 'object' ? normalizeScoreState(scoreState, format) : null;
  const serialized = JSON.stringify(normalized ?? scoreState);
  if (typeof ScoringEngine.fromSerialized === 'function') return ScoringEngine.fromSerialized(config, serialized);
  return new ScoringEngine(config);
}
