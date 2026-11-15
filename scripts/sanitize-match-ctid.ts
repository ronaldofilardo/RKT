import type { PrismaClient } from '@prisma/client';
import { createScriptPrisma } from './db/script-prisma';

export interface CtDivergence {
  id: string;
  ctId: string;
  createdByUserId: string | null;
}

export interface SanitizeSummary {
  /** Anotações com herança de ctId sem vínculo comprovado do criador com o CT. */
  divergent: number;
  /** Registros corrigidos (só com `--apply`). */
  fixed: number;
  apply: boolean;
}

/**
 * Saneamento idempotente de `ctId` em anotações derivadas (TD-065 Fase E).
 *
 * Só considera divergência *comprovada*: a anotação gravou o `ctId` do cartaz
 * (`a.ctId = t.ctId`) e o criador **nunca** teve vínculo algum com aquele CT
 * (nem membership ativa/encerrada, nem player_cts). Quem era membro na época
 * (ou tem o CT próprio no contexto ativo) não é tocado — o diagnóstico read-only
 * de 2026-11-14 apontou 0 divergências comprovadas em `racket_mvp`.
 *
 * Uso (sempre via preflight, P-01):
 *   pnpm db:sanitize:ctid            # dry-run: só reporta
 *   pnpm db:sanitize:ctid -- --apply # grava (idempotente: 2ª execução acha 0)
 */
export async function findCtDivergences(prisma: PrismaClient): Promise<CtDivergence[]> {
  return prisma.$queryRaw<CtDivergence[]>`
    SELECT a.id, a."ctId", a."createdByUserId"
    FROM "Match" a
    JOIN "Match" t ON t.id = a."sourceMatchId"
    WHERE a."deletedAt" IS NULL
      AND a."createdByUserId" IS NOT NULL
      AND a."ctId" IS NOT NULL
      AND a."ctId" = t."ctId"
      AND NOT EXISTS (
        SELECT 1 FROM memberships m
        WHERE m."ctId" = a."ctId" AND m."userId" = a."createdByUserId"
      )
      AND NOT EXISTS (
        SELECT 1 FROM player_cts p
        JOIN "Player" pl ON pl.id = p."playerId"
        WHERE p."ctId" = a."ctId" AND pl."userId" = a."createdByUserId"
      )
  `;
}

export async function sanitizeMatchCtId(
  prismaClient?: PrismaClient,
  options: { apply?: boolean } = {},
): Promise<SanitizeSummary> {
  const prisma = prismaClient ?? createScriptPrisma();
  try {
    const rows = await findCtDivergences(prisma);
    const summary: SanitizeSummary = {
      divergent: rows.length,
      fixed: 0,
      apply: Boolean(options.apply),
    };

    if (options.apply) {
      for (const row of rows) {
        await prisma.match.update({ where: { id: row.id }, data: { ctId: null } });
        summary.fixed++;
      }
    }

    return summary;
  } finally {
    if (!prismaClient) await prisma.$disconnect();
  }
}

if (require.main === module) {
  const apply = process.argv.includes('--apply');
  sanitizeMatchCtId(undefined, { apply })
    .then((res) => {
      const mode = res.apply ? 'APPLY' : 'DRY-RUN';
      console.log(
        `[sanitize-match-ctid] ${mode} — divergentes=${res.divergent} corrigidos=${res.fixed}`,
      );
      process.exit(0);
    })
    .catch((err) => {
      console.error('[sanitize-match-ctid] falha:', err);
      process.exit(1);
    });
}
