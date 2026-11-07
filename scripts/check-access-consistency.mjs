// Consistência User.role × vínculos (PLANO_FUNDACAO_PERFIS_v2, Fase 1A).
// SOMENTE LEITURA. Uso: node scripts/check-access-consistency.mjs
// Lista divergências entre o claim legado (`User.role`) e o derivado dos vínculos.
import { PrismaClient } from '@prisma/client'

// Premissa P-01 (docs/RULES.md): sempre rodar pelo pré-voo —
//   pnpm db:check:access          (banco local de desenvolvimento)
// O pré-voo valida o destino e exporta DATABASE_URL já conferida.
const LOOPBACK = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])
const databaseUrl = process.env.DATABASE_URL?.trim()

if (!databaseUrl) {
  console.error('[db] DATABASE_URL ausente. Rode via "pnpm db:check:access" (pré-voo P-01).')
  process.exit(1)
}

const host = new URL(databaseUrl).hostname.toLowerCase()
if (!LOOPBACK.has(host) && process.env.APP_ENV !== 'production') {
  console.error(
    `[db] BLOQUEADO: este script local não pode usar o banco "${host}". ` +
      'Use o pré-voo (pnpm db:check:access) ou defina APP_ENV=production conscientemente.',
  )
  process.exit(1)
}

console.log(`[db] alvo=${host}/${new URL(databaseUrl).pathname.slice(1)}`)
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } })

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
