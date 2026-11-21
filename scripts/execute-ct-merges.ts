import { PrismaClient } from '@prisma/client';
import { assertDbTarget, describeDbTarget } from '../src/lib/db/db-target';

interface MergePlan {
  name: string;
  category: 'UNIFICACAO_INTERNA' | 'REIVINDICACAO_CONTA_EXTERNA';
  targetId: string;
  sourceIds: string[];
  reason: string;
}

const TARGET_CT_ID = 'cmw49xfb600017kwdm0x2g2v5';

// Plano de execução conforme acordado com o usuário:
const plans: MergePlan[] = [
  // 1. Unificação interna no CT
  {
    name: 'ARTHUR KERR',
    category: 'UNIFICACAO_INTERNA',
    targetId: 'cmvseaisz000313qcdt9fxmj2', // mais recente e com 6 partidas
    sourceIds: ['cmvr7udih00077j4yyf6dshq0'], // 2 partidas
    reason: 'Unificação interna no CT: 2 perfis duplicados no CT Tênis Integrativo',
  },
  {
    name: 'HENRIQUE VISSOTTO',
    category: 'UNIFICACAO_INTERNA',
    targetId: 'cmvgzo1yy00034ae9whbfkzyp', // 3 partidas, data de nascimento 24/03/2017
    sourceIds: ['cmvjmidty0001by4tpca357ui'], // 0 partidas, sem data
    reason: 'Unificação interna no CT: perfil vazio duplicado no CT',
  },
  {
    name: 'TIAGO SORMANI',
    category: 'UNIFICACAO_INTERNA',
    targetId: 'cmvsea4jh000113qcsbm74vgb', // 2 partidas, criado em 28/10
    sourceIds: ['cmvr7to7900057j4yr7nmqa67'], // 2 partidas, criado em 27/10
    reason: 'Unificação interna no CT: 2 perfis duplicados no CT Tênis Integrativo',
  },

  // 2. Reivindicação de Contas Externas (com unificação de perfis locais e avulsos)
  {
    name: 'ARTHUR RUPPEL',
    category: 'REIVINDICACAO_CONTA_EXTERNA',
    targetId: 'cmwl1kikf000aq8gzd33lz6x5', // perfil com CONTA DE USUÁRIO (User: cmwl1kita000bq8gz76swnpj7) e nasc 20/09/2015
    sourceIds: ['cmvjss8jo00018v5xyer0i6i6'], // perfil no CT com 4 partidas e mesma data de nascimento
    reason: 'Vincular perfil com conta ao CT e mesclar perfil provisório do CT nele',
  },
  {
    name: 'LARISSA CABRAL',
    category: 'REIVINDICACAO_CONTA_EXTERNA',
    targetId: 'cmwl1ivp20001q8gz50knvevl', // perfil com CONTA DE USUÁRIO (User: cmwl1iw500002q8gzbv2qnqoj) e nasc 05/08/2017
    sourceIds: [
      'cmvh1gt2p0005r3qv8l424gdo', // perfil 1 no CT (1 partida)
      'cmvr0v3xu000d1hiqjdzb1gf1', // perfil 2 no CT (1 partida, nasc 05/08/2017)
      'cmv52hw0p00019fxbnsvrqn1b', // perfil avulso no pool (1 partida)
    ],
    reason: 'Vincular perfil com conta ao CT e mesclar perfis duplicados do CT e avulsos nele',
  },
  {
    name: 'VALENTINA MOLETTA',
    category: 'REIVINDICACAO_CONTA_EXTERNA',
    targetId: 'cmwkr2n5z000113gb21wfrzf4', // perfil com CONTA DE USUÁRIO (User: cmwkr2nm7000213gbcbq6bmqw), 5 partidas e nasc 29/11/2011
    sourceIds: [
      'cmw4av5o80005slt5y0qx9oem', // perfil no CT (0 partidas, nasc 29/11/2011)
      'cmuak28wu00018asqfvy5j3w2', // perfil avulso (2 partidas, nasc 29/11/2011)
      'cmvlca5vf000m6xhq9ocru4qh', // perfil avulso (2 partidas)
    ],
    reason: 'Vincular perfil com conta ao CT e mesclar perfil vazio do CT e avulsos nele',
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
    // 1. Validar existência do CT
    const ct = await prisma.trainingCenter.findUnique({
      where: { id: TARGET_CT_ID },
      select: { id: true, name: true, slug: true },
    });

    if (!ct) {
      throw new Error(`CT com ID ${TARGET_CT_ID} não encontrado!`);
    }

    console.log(`CT Alvo: ${ct.name} (${ct.id})\n`);

    // 2. Pré-validar todos os jogadores envolvidos
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

    for (const plan of plans) {
      console.log(`\n========================================================================`);
      console.log(`PLANO: [${plan.category}] ${plan.name}`);
      console.log(`Motivo: ${plan.reason}`);
      console.log(`Target (Destino Canônico):`);
      const targetP = playersMap.get(plan.targetId);
      if (!targetP) throw new Error(`Target ${plan.targetId} não existe no banco!`);
      const targetMatches =
        targetP._count.matchesAsPlayer1 +
        targetP._count.matchesAsPlayer2 +
        targetP._count.matchesAsPlayer1Partner +
        targetP._count.matchesAsPlayer2Partner;
      console.log(`  - ID: ${targetP.id}`);
      console.log(`    Nome: ${targetP.name} | Nasc: ${targetP.birthDate?.toISOString().split('T')[0] ?? 'sem data'}`);
      console.log(`    Partidas atuais: ${targetMatches}`);
      console.log(`    Conta User: ${targetP.user ? targetP.user.email : 'sem conta'}`);
      console.log(`    Vinculado ao CT alvo: ${targetP.playerCts.some((c) => c.ctId === TARGET_CT_ID) ? 'SIM' : 'NÃO'}`);

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
        console.log(`  - ID: ${sourceP.id} (Nome: "${sourceP.name}")`);
        console.log(`    Partidas a transferir: ${sourceMatches}`);
        console.log(`    Conta User: ${sourceP.user ? sourceP.user.email : 'sem conta'}`);
      }
    }

    if (!isExecute) {
      console.log('\n\n========================================================================');
      console.log('Fim da simulação (DRY-RUN). Nenhuma alteração foi gravada no banco.');
      console.log('Para aplicar, execute com --execute.');
      console.log('========================================================================\n');
      return;
    }

    // 3. Execução real dentro de transação
    console.log('\n\n⚡ INICIANDO TRANSAÇÃO DE MESCLAGEM EM PRODUÇÃO...');

    await prisma.$transaction(async (tx) => {
      for (const plan of plans) {
        console.log(`\nProcessando: ${plan.name}...`);

        // Garante que o target tenha vínculo ativo no CT
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

        // Mescla cada source
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

          console.log(`    Partidas reapontadas: P1=${m1.count}, P2=${m2.count}, P1Partner=${mp1.count}, P2Partner=${mp2.count}, Winner=${mw.count}`);
          console.log(`    Pontos reapontados: Winner=${pw.count}, Server=${ps.count}`);

          // Resolver PlayerCT
          // Para todos os CTs do source: se target já tem vínculo naquele CT, remove do source; senão, transfere
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
    });

    console.log('\n✔ TRANSAÇÃO CONCLUÍDA COM SUCESSO!\n');

    // 4. Auditoria pós-execução
    const updatedTargetCt = await prisma.trainingCenter.findUnique({
      where: { id: TARGET_CT_ID },
      include: {
        _count: {
          select: {
            playerCts: true,
            matches: true,
          },
        },
      },
    });

    console.log('========================================================================');
    console.log('ESTADO FINAL DO CT:');
    console.log(`CT: ${updatedTargetCt?.name}`);
    console.log(`Total de atletas vinculados agora (PlayerCT): ${updatedTargetCt?._count.playerCts}`);
    console.log('========================================================================\n');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[ERRO CRÍTICO NA EXECUÇÃO]:', err);
  process.exit(1);
});
