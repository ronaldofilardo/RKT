import type { Athlete } from './types';

export type SlotId = 'p1' | 'p2' | 'p1Partner' | 'p2Partner';
/** 'OWN' = atleta pertence ao meu clube (vincula ao CT). 'NOT_OWN' = adversário/avulso (sem vínculo). */
export type SlotAffiliation = 'OWN' | 'NOT_OWN';
export type SlotAffiliationMap = Record<SlotId, SlotAffiliation>;

/** Padrão seguro: nenhum slot é "meu clube" até o usuário marcar explicitamente. */
export function initialSlotAffiliation(): SlotAffiliationMap {
  return { p1: 'NOT_OWN', p2: 'NOT_OWN', p1Partner: 'NOT_OWN', p2Partner: 'NOT_OWN' };
}

/** Só considera "meu clube" quando o slot marca OWN e existe um CT selecionado. */
export function isOwnSlot(affiliation: SlotAffiliation | undefined, ctId: string | null): boolean {
  return affiliation === 'OWN' && !!ctId;
}

export function filterAthletesForSlot(
  athletes: Athlete[],
  affiliation: SlotAffiliation | undefined,
  ctId: string | null,
): Athlete[] {
  const target = ctId ? (ctId as string) : null;
  if (affiliation === 'OWN') {
    if (!target) return athletes;
    return athletes.filter(
      (a) => a.playerCts?.some((pc) => pc.ctId === target) || a.clubId === target,
    );
  }
  // NOT_OWN (ou undefined): lista apenas atletas de outros clubes,
  // excluindo os do meu clube quando um ctId estiver definido.
  // Nome e clube ficam visiveis no panel; novo atleta eh criado sem vinculo.
  if (target) {
    return athletes.filter(
      (a) => !(a.playerCts?.some((pc) => pc.ctId === target) || a.clubId === target),
    );
  }
  return athletes;
}
