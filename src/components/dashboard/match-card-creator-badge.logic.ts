export interface CreatorBadgeInput {
  createdByName?: string | null;
  isP1Own: boolean;
  isP2Own: boolean;
}

export function resolveCreatorBadges({
  createdByName,
  isP1Own,
  isP2Own,
}: CreatorBadgeInput): { p1CreatorBadge: string | null; p2CreatorBadge: string | null } {
  if (!createdByName) return { p1CreatorBadge: null, p2CreatorBadge: null };

  const badgeText = `Criada por ${createdByName}`;

  // Se P1 é do clube/atleta do usuário e P2 é adversário:
  if (isP1Own && !isP2Own) {
    return { p1CreatorBadge: null, p2CreatorBadge: badgeText };
  }

  // Se P2 é do clube/atleta do usuário e P1 é adversário:
  if (isP2Own && !isP1Own) {
    return { p1CreatorBadge: badgeText, p2CreatorBadge: null };
  }

  // Se nenhum for ou ambos forem do mesmo clube:
  return { p1CreatorBadge: null, p2CreatorBadge: badgeText };
}

