import { getProfiles } from './profiles';
import type { Actor } from './types';

/** NONE = sem claim legado válido: rotas legadas respondem 401 (desejado). */
export type LegacyRole = 'ADMIN' | 'ANNOTATOR' | 'NONE';

/** Claim legado derivado dos vínculos (§6.4). */
export function deriveLegacyRole(actor: Actor): LegacyRole {
  const profiles = getProfiles(actor);
  if (profiles.includes('ADMIN')) return 'ADMIN';
  const operates = profiles.some((p) =>
    ['OPERACIONAL', 'GESTOR', 'TREINADOR', 'ATLETA'].includes(p),
  );
  return operates ? 'ANNOTATOR' : 'NONE';
}
