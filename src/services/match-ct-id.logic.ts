import type { RLSUser } from '@/lib/rls-storage.logic';

export type MatchCtUser = Pick<RLSUser, 'contextId'> | null | undefined;

/**
 * Resolve o `ctId` soberano de uma partida/cartaz na criação (Fase C do plano).
 *
 * - `PARTICULAR` ativo → `null` (nunca herda vínculo de CT);
 * - contexto de CT preenchido → o próprio `contextId`;
 * - token sem `contextId` → `fallbackCtId ?? null` (compatibilidade com tokens legados).
 *
 * É o único ponto que decide `ctId` de `POST /api/matches`, `createEventTemplate` e
 * `createAnnotationFromTemplate`: o valor gravado precisa bater com o filtro de lista
 * (`buildMatchListWhere`) para a partida não "desaparecer" do próprio criador.
 */
export function resolveMatchCtId(
  user: MatchCtUser,
  fallbackCtId?: string | null,
): string | null {
  if (user?.contextId === 'PARTICULAR') return null;
  if (user?.contextId) return user.contextId;
  return fallbackCtId ?? null;
}

/**
 * Resolve o `ctId` das rotas de anotação (`/annotate` e `/pool/[templateId]/annotate`),
 * onde não há `ctId` de fallback:
 *
 * - `null` → contexto `PARTICULAR` ativo: força a derivada sem CT. Corrige o bug em que
 *   `resolveDerivedCtId` caía em `template.ctId` e gravava o CT do cartaz mesmo no modo
 *   Particular — a anotação sumia da lista do criador e `canAnnotateMatch` devolvia 403;
 * - `undefined` → token sem contexto: mantém a inferência de `template.ctId` restrita a
 *   membros ativos do CT (ex.: atleta anotando cartaz do clube mantém o vínculo);
 * - `string` → contexto de CT ativo.
 */
export function resolveAnnotationCtId(user: MatchCtUser): string | null | undefined {
  if (!user?.contextId) return undefined;
  return resolveMatchCtId(user);
}
