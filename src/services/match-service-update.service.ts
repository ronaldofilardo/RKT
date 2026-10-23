import { prisma } from "@/lib/prisma";
import { getPrismaErrorCode } from "@/lib/errors";
import {
  sanitizeMatchUpdate,
  buildMatchUpdateData,
} from "./match-service-operations.logic";

export async function updateMatch(
  id: string,
  data: Record<string, unknown>,
  expectedVersion?: number,
) {
  const match = await prisma.match.findFirst({ where: { id } });
  if (!match) return null;

  const sanitized = sanitizeMatchUpdate(data);
  const updateData = buildMatchUpdateData(sanitized);

  const whereClause = expectedVersion !== undefined ? { id, version: expectedVersion } : { id };

  try {
    return await prisma.match.update({
      where: whereClause,
      data: { ...updateData, version: { increment: 1 } },
      include: { player1: true, player2: true },
    });
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2025') return { error: 'VERSION_CONFLICT' } as const;
    throw error;
  }
}
