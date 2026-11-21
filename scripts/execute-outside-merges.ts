import { PrismaClient } from '@prisma/client';
import { assertDbTarget, describeDbTarget } from '../src/lib/db/db-target';

interface OutsideMergePlan {
  name: string;
  category: string;
  targetId: string;
  sourceIds: string[];
  reason: string;
}

const TARGET_CT_ID = 'cmw49xfb600017kwdm0x2g2v5';

const plans: OutsideMergePlan[] = [
  {
    name: 'ARTHUR KERR',
    category: 'UNIFICACAO_EXTERNA_POOL',
    targetId: 'cmvseaisz000313qcdt9fxmj2', // perfil canônico no CT (8 partidas)
    sourceIds: ['cmvlc6edp001dz6momc2rsapm'], // perfil avulso no pool (1 partida)
    reason: 'Unificação de perfil avulso externo no perfil canônico do CT',
  },
  {
    name: 'HENRIQUE VISSOTTO',
    category: 'UNIFICACAO_EXTERNA_POOL',
    targetId: 'cmvgzo1yy00034ae9whbfkzyp', // perfil canônico no CT (3 partidas, nasc 2017-03-24)
    sourceIds: ['cmvjuan1l0001wqzgfp7uyj8o'], // perfil avulso no pool (0 partidas)
    reason: 'Eliminação de perfil externo vazio',
  },
  {
    name: 'PIETRA SANS',
    category: 'UNIFICACAO_EXTERNA_POOL',
    targetId: 'cmvtyw6nx0001grialyzxkh33', // perfil canônico no CT (1 partida, nasc 2016-02-20)
    sourceIds: ['cmwdz5yp70001r6li6w8y3211'], // perfil avulso no pool (1 partida)
    reason: 'Unificação de perfil externo avulso no perfil canônico do CT',
  },
  {
    name: 'LUIZA MANDIN',
    category: 'UNIFICACAO_EXTERNA_CONTA',
    targetId: 'cmv19a1vs0001hzxaa0lxb3zs', // perfil no CT (2 partidas)
    sourceIds: ['cmwl1ji7u0004q8gzkzttpy22'], // perfil externo com conta e nasc 2017-07-05 (1 partida)
    reason: 'Unificação de perfil externo com conta no perfil do CT, transferindo conta e nascimento',
  },
  {
    name: 'GUILHERME STENCEL',
    category: 'UNIFICACAO_EXTERNA_POOL',
    targetId: 'cmvh2dksq000399ekv7r72t21', // perfil canônico no CT (4 partidas)
    sourceIds: [
      'cmvr7x0wm000b7j4ypzs3azh9', // perfil avulso (6 partidas, inclusive cmwpoe5ms0006gvhbnytuggea)
      'cmwjyvrpz0004ikyot0d9g8gk', // perfil externo com conta (6 partidas)
    ],
    reason: 'Consolidação de 2 perfis externos (12 partidas) no perfil canônico do CT',
  },
  {
    name: 'GABRIEL SARES DA SILVA',
    category: 'UNIFICACAO_EXTERNA_E_VARIANTE',
    targetId: 'cmvr7ja3w00017j4y0yi1ukov', // perfil canônico no CT (2 partidas, nasc 2001-01-01)
    sourceIds: [
      'cmwkrjh5k0005gadadzsdngfd', // "Gabriel Sares da Silva" externo (2 partidas, inclusive cmwpoe5ms0006gvhbnytuggea)
      'cmwjyv14q0001ikyooq1fyyel', // "Gabriel Sares da Silva" externo (5 partidas)
      'cmvsdtblx0003nw52t0u13t09', // "Gabriel Sares" externo (3 partidas)
      'cmvihkqfh0003oumhzxcwvh2t', // "Gabriel Sares" externo (5 partidas)
    ],
    reason: 'Consolidação de 4 perfis externos (Gabriel Sares da Silva + Gabriel Sares, 15 partidas) no perfil do CT',
  },
];

async function main() {
  const isExecute = process.argv.includes('--execute');

  const target = (() => {
    try {
      return assertDbTarget();
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  })();

  console.log(`[db] Conectado: ${describeDbTarget(target)} (env=${target.env})`);
  console.log(`[modo]: ${isExecute ? '⚡ EXECUÇÃO REAL' : '🔍 DRY-RUN (simulação)'}\n`);

  const prisma = new PrismaClient({ datasources: { db: { url: target.url } } });

  try {
    const ct = await prisma.trainingCenter.findUnique({
      where: { id: TARGET_CT_ID },
      select: { id: true, name: true, slug: true },
    });

    if (!ct) {
      throw new Error(`CT com ID ${TARGET_CT_ID} não encontrado!`);
    }

    console.log(`CT Alvo: ${ct.name} (${ct.id})\n`);

    // Validar existência de todos os jogadores
    const allPlayerIds = new Set<string>();
    plans.forEach((p) => {
      allPlayerIds.add(p.targetId);
      p.sourceIds.forEach((sid) => allPlayerIds.add(sid));
    });

    const playersDb = await prisma.player.findMany({
      where: { id: { in: Array.from(allPlayerIds) } },
      include: {
        user: { select: { id: true, email: true } },
        playerCts: { select: { ctId: true, status: true } },
        _count: {
          select: {
            matchesAsPlayer1: true,
            matchesAsPlayer2: true,
            matchesAsPlayer1Partner: true,
            matchesAsPlayer2Partner: true,
          },
        },
      },
    });

    const playersMap = new Map(playersDb.map((p) => [p.id, p]));

    let totalMatchesToTransfer = 0;

    for (const plan of plans) {
      console.log(`========================================================================`);
      console.log(`PLANO: [${plan.category}] ${plan.name}`);
      console.log(`Motivo: ${plan.reason}`);
      console.log(`Target (Destino Canônico no CT):`);
      const targetP = playersMap.get(plan.targetId);
      if (!targetP) throw new Error(`Target ${plan.targetId} não existe no banco!`);
      const targetMatches =
        targetP._count.matchesAsPlayer1 +
        targetP._count.matchesAsPlayer2 +
        targetP._count.matchesAsPlayer1Partner +
        targetP._count.matchesAsPlayer2Partner;
      console.log(`  - ID: ${targetP.id}`);
      console.log(`    Nome: "${targetP.name}" | Nasc: ${targetP.birthDate?.toISOString().split('T')[0] ?? 'sem data'}`);
      console.log(`    Partidas atuais: ${targetMatches}`);
      console.log(`    Conta User: ${targetP.user ? targetP.user.email : 'sem conta'}`);
      console.log(`    Vinculado ao CT: ${targetP.playerCts.some((c) => c.ctId === TARGET_CT_ID) ? 'SIM' : 'NÃO'}`);

      console.log(`Sources (Perfis a serem mesclados no Target):`);
      for (const sid of plan.sourceIds) {
        const sourceP = playersMap.get(sid);
        if (!sourceP) throw new Error(`Source ${sid} não existe no banco!`);
        if (sourceP.mergedIntoId) {
          console.warn(`  ⚠️ AVISO: Source ${sid} já possui mergedIntoId = ${sourceP.mergedIntoId}`);
        }
        const sourceMatches =
          sourceP._count.matchesAsPlayer1 +
          sourceP._count.matchesAsPlayer2 +
          sourceP._count.matchesAsPlayer1Partner +
          sourceP._count.matchesAsPlayer2Partner;
        totalMatchesToTransfer += sourceMatches;
        console.log(`  - ID: ${sourceP.id} (Nome: "${sourceP.name}")`);
        console.log(`    Partidas a transferir: ${sourceMatches}`);
        console.log(`    Conta User: ${sourceP.user ? sourceP.user.email : 'sem conta'}`);
        console.log(`    Nascimento: ${sourceP.birthDate?.toISOString().split('T')[0] ?? 'sem data'}`);
      }
      console.log('');
    }

    console.log(`TOTAL DE PARTIDAS A SEREM TRANSFERIDAS: ${totalMatchesToTransfer}\n`);

    if (!isExecute) {
      console.log('========================================================================');
      console.log('Fim da simulação (DRY-RUN). Nenhuma alteração foi gravada no banco.');
      console.log('Para aplicar, execute com a flag --execute.');
      console.log('========================================================================\n');
      return;
    }

    console.log('⚡ INICIANDO TRANSAÇÃO ATÔMICA DE MESCLAGEM EM PRODUÇÃO...\n');

    await prisma.$transaction(
      async (tx) => {
        for (const plan of plans) {
          console.log(`\n▶ Processando: ${plan.name}...`);

          // 1. Garantir vínculo ativo no CT para o target
          const targetCtLink = await tx.playerCT.findUnique({
            where: { playerId_ctId: { playerId: plan.targetId, ctId: TARGET_CT_ID } },
          });

          if (!targetCtLink) {
            console.log(`  ➕ Criando vínculo PlayerCT para target ${plan.targetId} no CT ${TARGET_CT_ID}`);
            await tx.playerCT.create({
              data: {
                playerId: plan.targetId,
                ctId: TARGET_CT_ID,
                status: 'ACTIVE',
              },
            });
          } else if (targetCtLink.status !== 'ACTIVE') {
            console.log(`  🔄 Reativando vínculo PlayerCT para target ${plan.targetId}`);
            await tx.playerCT.update({
              where: { playerId_ctId: { playerId: plan.targetId, ctId: TARGET_CT_ID } },
              data: { status: 'ACTIVE', endedAt: null },
            });
          }

          let currentTarget = await tx.player.findUnique({
            where: { id: plan.targetId },
            select: { id: true, userId: true, birthDate: true },
          });

          // 2. Mesclar cada source
          for (const sourceId of plan.sourceIds) {
            console.log(`  Reapontando partidas de source ${sourceId} -> target ${plan.targetId}...`);

            const m1 = await tx.match.updateMany({
              where: { player1Id: sourceId },
              data: { player1Id: plan.targetId },
            });
            const m2 = await tx.match.updateMany({
              where: { player2Id: sourceId },
              data: { player2Id: plan.targetId },
            });
            const mp1 = await tx.match.updateMany({
              where: { player1PartnerId: sourceId },
              data: { player1PartnerId: plan.targetId },
            });
            const mp2 = await tx.match.updateMany({
              where: { player2PartnerId: sourceId },
              data: { player2PartnerId: plan.targetId },
            });
            const mw = await tx.match.updateMany({
              where: { winnerId: sourceId },
              data: { winnerId: plan.targetId },
            });

            const pw = await tx.pointLog.updateMany({
              where: { winnerId: sourceId },
              data: { winnerId: plan.targetId },
            });
            const ps = await tx.pointLog.updateMany({
              where: { serverId: sourceId },
              data: { serverId: plan.targetId },
            });

            console.log(
              `    Partidas reapontadas: P1=${m1.count}, P2=${m2.count}, P1Partner=${mp1.count}, P2Partner=${mp2.count}, Winner=${mw.count}`
            );
            console.log(`    Pontos reapontados: Winner=${pw.count}, Server=${ps.count}`);

            // Resolver PlayerCT
            const sourceCts = await tx.playerCT.findMany({ where: { playerId: sourceId } });
            for (const sCt of sourceCts) {
              const targetHasCt = await tx.playerCT.findUnique({
                where: { playerId_ctId: { playerId: plan.targetId, ctId: sCt.ctId } },
              });
              if (targetHasCt) {
                await tx.playerCT.delete({ where: { id: sCt.id } });
              } else {
                await tx.playerCT.update({
                  where: { id: sCt.id },
                  data: { playerId: plan.targetId },
                });
              }
            }

            // Resolver CoachAthleteLink
            const sourceCoachLinks = await tx.coachAthleteLink.findMany({ where: { playerId: sourceId } });
            for (const sLink of sourceCoachLinks) {
              const targetHasCoach = await tx.coachAthleteLink.findUnique({
                where: { coachUserId_playerId: { coachUserId: sLink.coachUserId, playerId: plan.targetId } },
              });
              if (targetHasCoach) {
                await tx.coachAthleteLink.delete({ where: { id: sLink.id } });
              } else {
                await tx.coachAthleteLink.update({
                  where: { id: sLink.id },
                  data: { playerId: plan.targetId },
                });
              }
            }

            // Resolver GuardianLink
            await tx.guardianLink.updateMany({
              where: { playerId: sourceId },
              data: { playerId: plan.targetId },
            });

            // Resolver ConsentRecord
            await tx.consentRecord.updateMany({
              where: { playerId: sourceId },
              data: { playerId: plan.targetId },
            });

            // Resolver GuardianInvite
            await tx.guardianInvite.updateMany({
              where: { playerId: sourceId },
              data: { playerId: plan.targetId },
            });

            // Resolver ConsentEvent
            await tx.consentEvent.updateMany({
              where: { playerId: sourceId },
              data: { playerId: plan.targetId },
            });

            // Resolver dados cadastrais (BirthDate e Conta User)
            const sourcePlayer = await tx.player.findUnique({
              where: { id: sourceId },
              select: { id: true, userId: true, birthDate: true },
            });

            if (sourcePlayer) {
              // Se target não tem birthDate e source tem, copia
              if (!currentTarget?.birthDate && sourcePlayer.birthDate) {
                console.log(`    Copiar nascimento ${sourcePlayer.birthDate.toISOString().slice(0, 10)} para target`);
                await tx.player.update({
                  where: { id: plan.targetId },
                  data: { birthDate: sourcePlayer.birthDate },
                });
                currentTarget = { ...currentTarget!, birthDate: sourcePlayer.birthDate };
              }

              // Se target não tem conta de usuário e source tem conta, transfere a conta
              if (!currentTarget?.userId && sourcePlayer.userId) {
                console.log(`    Transferindo conta de usuário ${sourcePlayer.userId} para target`);
                // Primeiro desvincula do source para não violar @unique
                await tx.player.update({
                  where: { id: sourceId },
                  data: { userId: null },
                });
                await tx.player.update({
                  where: { id: plan.targetId },
                  data: { userId: sourcePlayer.userId },
                });
                currentTarget = { ...currentTarget!, userId: sourcePlayer.userId };
              } else if (sourcePlayer.userId) {
                // Se target já tem conta e source também tem uma conta provisória, desvincula do source
                console.log(`    Desvinculando conta sobressalente do source ${sourcePlayer.userId}`);
                await tx.player.update({
                  where: { id: sourceId },
                  data: { userId: null },
                });
              }
            }

            // Marcar source como mesclado
            await tx.player.update({
              where: { id: sourceId },
              data: { mergedIntoId: plan.targetId },
            });

            // Gravar AuditLog
            await tx.auditLog.create({
              data: {
                action: 'player:merge',
                resourceType: 'Player',
                resourceId: plan.targetId,
                ctId: TARGET_CT_ID,
                meta: {
                  sourceId,
                  targetId: plan.targetId,
                  athleteName: plan.name,
                  category: plan.category,
                  reason: plan.reason,
                },
              },
            });
          }
        }
      },
      { timeout: 30000 }
    );

    console.log('\n✔ TRANSAÇÃO ATÔMICA CONCLUÍDA COM SUCESSO!\n');

    // 4. Verificação pós-mesclagem
    console.log('========================================================================');
    console.log('VERIFICAÇÃO PÓS-MESCLAGEM');
    console.log('========================================================================');

    for (const plan of plans) {
      const p = await prisma.player.findUnique({
        where: { id: plan.targetId },
        include: {
          user: { select: { email: true } },
          _count: {
            select: {
              matchesAsPlayer1: true,
              matchesAsPlayer2: true,
              matchesAsPlayer1Partner: true,
              matchesAsPlayer2Partner: true,
            },
          },
        },
      });

      const totalMatches =
        (p?._count.matchesAsPlayer1 ?? 0) +
        (p?._count.matchesAsPlayer2 ?? 0) +
        (p?._count.matchesAsPlayer1Partner ?? 0) +
        (p?._count.matchesAsPlayer2Partner ?? 0);

      console.log(`✔ ${plan.name} (${plan.targetId}): Total de Partidas = ${totalMatches} | User = ${p?.user?.email ?? 'Sem conta'}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('\n[ERRO NA EXECUÇÃO]:', err);
  process.exit(1);
});
