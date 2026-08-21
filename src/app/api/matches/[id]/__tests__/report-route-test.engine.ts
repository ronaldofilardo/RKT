function getMockServeFlags(flow: any) {
  return {
    isFirstServe: flow.isFirstServe ?? true,
    isSecondServe: flow.isSecondServe ?? false,
  };
}

function getMockPointMetadata(flow: any) {
  return {
    isLet: false,
    serverId: flow.serverId,
    timestamp: flow.timestamp ?? Date.now(),
    rallyDetails: flow.rallyDetails ?? null,
    rallyLength: flow.rallyLength ?? 0,
    firstFaultDetail: flow.firstFaultDetail ?? null,
  };
}

function buildMockPoint(flow: any) {
  return {
    winnerId: flow.winnerId,
    type: flow.type,
    ...getMockServeFlags(flow),
    ...getMockPointMetadata(flow),
  };
}

function buildMockHistoryEntry(handler: any, flow: any) {
  return {
    stateBefore: JSON.parse(JSON.stringify(handler._state)),
    point: buildMockPoint(flow),
  };
}

export function recordMockPoint(handler: any, flow: any) {
  handler._hist.push(buildMockHistoryEntry(handler, flow));
}

export function updateMockGame(handler: any, flow: any) {
  const winner = flow.winnerId === handler._cfg.player1Id ? 'player1' : 'player2';
  const game = handler._state.currentGame;
  if (flow.type === 'FAULT_FIRST') game.secondServe = true;
  else if (winner === 'player1') game.player1 += 1;
  else game.player2 += 1;
}

export function applyMockPoint(handler: any, flow: any) {
  recordMockPoint(handler, flow);
  updateMockGame(handler, flow);
  return handler._state;
}
