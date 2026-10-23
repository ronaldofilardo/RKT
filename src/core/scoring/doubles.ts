/**
 * Fachada do domínio de duplas — API pública reexportada de módulos coesos:
 * - doubles-members.ts: membros, lados e quadra (deuce/ad)
 * - doubles-serving.ts: sacador, receptor e ponto decisivo no-ad
 * - doubles-arrangement.ts: derivação e validação de arranjos
 */
export {
  sideOfPlayer,
  membersOf,
  otherMember,
  courtSide,
  advanceServeIndex,
} from './doubles-members';

export {
  getServingMemberId,
  getReceiverMemberId,
  isNoAdDecidingPoint,
} from './doubles-serving';

export {
  deriveArrangementFromGames,
  validateDoublesArrangement,
} from './doubles-arrangement';
