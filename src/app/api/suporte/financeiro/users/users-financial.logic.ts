import { prisma } from '@/lib/prisma';
import { mapUserFinancialStatus, type RawFinancialUserData } from './users-financial-mapper';

export async function listUsersFinancialLogic() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      role: true,
      createdAt: true,
      memberships: {
        where: { status: 'ACTIVE' },
        select: { kind: true, ctId: true, ct: { select: { name: true } } },
      },
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { invoices: { orderBy: { createdAt: 'desc' }, take: 1 } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const userIds = users.map((u) => u.id);
  const matchCounts = await prisma.match.groupBy({
    by: ['createdByUserId'],
    where: { createdByUserId: { in: userIds }, deletedAt: null },
    _count: { id: true },
  });
  const countMap = new Map(matchCounts.map((m) => [m.createdByUserId, m._count.id]));

  const items = users.map((u) => {
    const activeMembership = u.memberships[0];
    const isLinkedToPayingEntity = u.memberships.some((m) => m.kind === 'TREINADOR' && m.ctId);
    const raw: RawFinancialUserData = {
      id: u.id,
      name: u.name,
      email: u.email,
      cpf: u.cpf,
      role: u.role,
      createdAt: u.createdAt,
      matchesCount: countMap.get(u.id) ?? 0,
      clubName: activeMembership?.ct?.name ?? null,
      isLinkedToPayingEntity,
      subscription: u.subscriptions[0] ?? null,
    };
    return mapUserFinancialStatus(raw);
  });

  return { items, total: items.length };
}
