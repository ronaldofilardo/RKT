import type { PointFlow, PointDetails, ScoringState, ScoringEngineConfig } from './types';
import { getServingMemberId, getReceiverMemberId, courtSide } from './doubles';

function computeRallyLength(flow: PointFlow): number {
  if (flow.rallyLength !== undefined) return flow.rallyLength;
  if (flow.type === 'ACE' || flow.type === 'DOUBLE_FAULT') return 1;
  if (flow.rallyDetails?.situacao === 'devolucao') return 2;
  return 0;
}

export function buildPointDetails(
  flow: PointFlow,
  state: ScoringState,
  config: ScoringEngineConfig,
  isSecondServeState = false,
): PointDetails {
  const hasFirstFaultDetail = Boolean(
    flow.firstFaultDetail &&
      (flow.firstFaultDetail.errorType ||
        flow.firstFaultDetail.serveEffect ||
        flow.firstFaultDetail.direction ||
        Object.keys(flow.firstFaultDetail).length > 0)
  );

  const isSecondServe =
    flow.type === 'DOUBLE_FAULT' ||
    hasFirstFaultDetail ||
    flow.isSecondServe === true ||
    flow.isFirstServe === false ||
    isSecondServeState;

  const isFirstServe = !isSecondServe;

  let serverId = flow.serverId;
  let receiverId = flow.receiverId;
  let courtSideValue = flow.courtSide;
  let hitterId = flow.hitterId;

  if (config.doubles) {
    if (!serverId) {
      serverId = getServingMemberId(state, config.doubles);
    }
    if (!courtSideValue) {
      courtSideValue = courtSide(state);
    }
    if (!receiverId) {
      receiverId = getReceiverMemberId(state, config.doubles, flow.receiverId);
    }
    if (!hitterId) {
      if (flow.type === 'ACE' || flow.type === 'DOUBLE_FAULT') {
        hitterId = serverId;
      } else {
        hitterId = flow.winnerId;
      }
    }
  }

  return {
    winnerId: flow.winnerId,
    type: (flow.type as PointDetails['type']) || 'WINNER',
    isFirstServe,
    isSecondServe,
    serverId,
    timestamp: flow.timestamp ?? Date.now(),
    rallyDetails: flow.rallyDetails ?? null,
    rallyLength: computeRallyLength(flow),
    firstFaultDetail: flow.firstFaultDetail ?? null,
    ...(receiverId !== undefined ? { receiverId } : {}),
    ...(courtSideValue !== undefined ? { courtSide: courtSideValue } : {}),
    ...(hitterId !== undefined ? { hitterId } : {}),
  };
}
