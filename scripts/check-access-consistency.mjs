// Consistência User.role × vínculos (PLANO_FUNDACAO_PERFIS_v2, Fase 1A).
// SOMENTE LEITURA. Uso: node scripts/check-access-consistency.mjs
// Lista divergências entre o claim legado (`User.role`) e o derivado dos vínculos.
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function derive(user) {
  const active = user.memberships.filter((m) => m.status === 'ACTIVE')
  const isAdmin = active.some((m) => m.kind === 'PLATAFORMA' && m.preset === 'ADMIN')
  if (!user.isActive) return 'NONE'
  if (isAdmin) return 'ADMIN'
  const operates =
    user.canOperate ||
    !!user.athleteProfile ||
    active.some((m) => m.kind === 'GESTOR' || m.kind === 'TREINADOR')
  return operates ? 'ANNOTATOR' : 'NONE'
}

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      canOperate: true,
      memberships: { select: { kind: true, preset: true, status: true } },
      athleteProfile: { select: { id: true } },
    },
  })
  const diverging = users.filter((u) => u.isActive && derive(u) !== u.role)
  const adminsThatOperate = users.filter((u) => u.role === 'ADMIN' && u.canOperate)

  console.log(`Usuários: ${users.length} | divergentes: ${diverging.length}`)
  for (const u of diverging) {
    console.log(` - ${u.email}: role=${u.role} derivado=${derive(u)} canOperate=${u.canOperate}`)
  }
  console.log(`Admins que também operam (P4): ${adminsThatOperate.length}`)
  for (const u of adminsThatOperate) console.log(` - ${u.email}`)
  process.exitCode = diverging.length > 0 ? 1 : 0
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 2
  })
  .finally(() => prisma.$disconnect())
