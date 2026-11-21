import { PrismaClient } from '@prisma/client';
import { assertDbTarget, describeDbTarget } from '../src/lib/db/db-target';
import {
  normalizeName,
  sameDay,
  sameCpfHash,
  sameLast2AndDob,
  sameNameAndDob,
  type PlayerProbe,
} from '../src/core/athlete/dedup';

interface AthleteRecord {
  id: string;
  name: string;
  nickname: string | null;
  email: string | null;
  cpf: string | null;
  cpfHash: string | null;
  cpfLast2: string | null;
  birthDate: Date | null;
  age: number | null;
  gender: string | null;
  identityStatus: string;
  mergedIntoId: string | null;
  createdAt: Date;
  userId: string | null;
  userEmail: string | null;
  userCpf: string | null;
  ctStatus: string;
  since: Date;
  matchesCount: number;
}

interface DuplicateGroup {
  reason: string;
  key: string;
  athletes: AthleteRecord[];
}

async function main() {
  const ctId = process.argv[2] || 'cmw49xfb600017kwdm0x2g2v5';

  const target = (() => {
    try {
      return assertDbTarget();
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  })();

  console.log(`[db] Conectando ao banco: ${describeDbTarget(target)} (env=${target.env})`);
  const prisma = new PrismaClient({ datasources: { db: { url: target.url } } });

  try {
    const ct = await prisma.trainingCenter.findUnique({
      where: { id: ctId },
      include: {
        _count: {
          select: {
            playerCts: true,
            matches: true,
            memberships: true,
          },
        },
      },
    });

    if (!ct) {
      console.error(`[ERRO] TrainingCenter com ID "${ctId}" não foi encontrado no banco.`);
      process.exit(1);
    }

    console.log('\n============================================================');
    console.log(`CT ENCONTRADO: ${ct.name} (${ct.slug})`);
    console.log(`ID: ${ct.id}`);
    console.log(`CNPJ: ${ct.cnpj || 'Não informado'} | Status: ${ct.status}`);
    console.log(`Total PlayerCTs vinculados: ${ct._count.playerCts}`);
    console.log(`Total de Partidas do CT: ${ct._count.matches}`);
    console.log('============================================================\n');

    // Busca todos os vínculos de atletas com este CT
    const playerCts = await prisma.playerCT.findMany({
      where: { ctId },
      include: {
        player: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                cpf: true,
              },
            },
            _count: {
              select: {
                matchesAsPlayer1: true,
                matchesAsPlayer2: true,
                matchesAsPlayer1Partner: true,
                matchesAsPlayer2Partner: true,
              },
            },
          },
        },
      },
      orderBy: { since: 'asc' },
    });

    const athletes: AthleteRecord[] = playerCts.map((pct) => {
      const p = pct.player;
      const matchesCount =
        p._count.matchesAsPlayer1 +
        p._count.matchesAsPlayer2 +
        p._count.matchesAsPlayer1Partner +
        p._count.matchesAsPlayer2Partner;

      return {
        id: p.id,
        name: p.name,
        nickname: p.nickname,
        email: p.email,
        cpf: p.cpf,
        cpfHash: p.cpfHash,
        cpfLast2: p.cpfLast2,
        birthDate: p.birthDate,
        age: p.age,
        gender: p.gender,
        identityStatus: p.identityStatus,
        mergedIntoId: p.mergedIntoId,
        createdAt: p.createdAt,
        userId: p.userId,
        userEmail: p.user?.email || null,
        userCpf: p.user?.cpf || null,
        ctStatus: pct.status,
        since: pct.since,
        matchesCount,
      };
    });

    console.log(`Total de registros de atletas encontrados para o CT: ${athletes.length}\n`);

    if (athletes.length === 0) {
      console.log('Nenhum atleta vinculado a este CT.');
      return;
    }

    // Identificação de duplicidades
    const duplicateGroups: DuplicateGroup[] = [];
    const groupedPairs = new Set<string>();

    const pairKey = (id1: string, id2: string) => [id1, id2].sort().join('::');

    // 1. Duplicidade por CPF (Player.cpf ou User.cpf ou cpfHash)
    const cpfMap = new Map<string, AthleteRecord[]>();
    const cpfHashMap = new Map<string, AthleteRecord[]>();
    const nameMap = new Map<string, AthleteRecord[]>();
    const emailMap = new Map<string, AthleteRecord[]>();

    for (const a of athletes) {
      const effectiveCpf = (a.cpf || a.userCpf || '').replace(/\D/g, '');
      if (effectiveCpf.length === 11) {
        const list = cpfMap.get(effectiveCpf) || [];
        list.push(a);
        cpfMap.set(effectiveCpf, list);
      }

      if (a.cpfHash) {
        const list = cpfHashMap.get(a.cpfHash) || [];
        list.push(a);
        cpfHashMap.set(a.cpfHash, list);
      }

      const effectiveEmail = (a.email || a.userEmail || '').trim().toLowerCase();
      if (effectiveEmail) {
        const list = emailMap.get(effectiveEmail) || [];
        list.push(a);
        emailMap.set(effectiveEmail, list);
      }

      const normName = normalizeName(a.name);
      if (normName) {
        const list = nameMap.get(normName) || [];
        list.push(a);
        nameMap.set(normName, list);
      }
    }

    // Registra grupos por CPF
    for (const [cpf, list] of cpfMap.entries()) {
      if (list.length > 1) {
        duplicateGroups.push({
          reason: 'Mesmo CPF (exato)',
          key: `CPF: ${cpf.slice(0, 3)}.***.***-${cpf.slice(-2)}`,
          athletes: list,
        });
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            groupedPairs.add(pairKey(list[i].id, list[j].id));
          }
        }
      }
    }

    // Registra grupos por cpfHash (onde CPF limpo não bateu ou estava nulo)
    for (const [hash, list] of cpfHashMap.entries()) {
      if (list.length > 1) {
        const unrecorded = list.some((a, idx) =>
          list.slice(idx + 1).some((b) => !groupedPairs.has(pairKey(a.id, b.id)))
        );
        if (unrecorded) {
          duplicateGroups.push({
            reason: 'Mesmo cpfHash (HMAC)',
            key: `Hash: ${hash.slice(0, 8)}...`,
            athletes: list,
          });
          for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
              groupedPairs.add(pairKey(list[i].id, list[j].id));
            }
          }
        }
      }
    }

    // Registra grupos por Email
    for (const [email, list] of emailMap.entries()) {
      if (list.length > 1) {
        const unrecorded = list.some((a, idx) =>
          list.slice(idx + 1).some((b) => !groupedPairs.has(pairKey(a.id, b.id)))
        );
        if (unrecorded) {
          duplicateGroups.push({
            reason: 'Mesmo E-mail',
            key: `Email: ${email}`,
            athletes: list,
          });
          for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
              groupedPairs.add(pairKey(list[i].id, list[j].id));
            }
          }
        }
      }
    }

    // Registra grupos por Nome Normalizado
    for (const [name, list] of nameMap.entries()) {
      if (list.length > 1) {
        // Verifica se tem mesma data de nascimento ou apenas mesmo nome
        const sameDob = list.every(
          (a) => a.birthDate && list[0].birthDate && sameDay(a.birthDate, list[0].birthDate)
        );
        const reason = sameDob
          ? 'Mesmo Nome e Mesma Data de Nascimento (sameNameAndDob)'
          : 'Mesmo Nome Normalizado (possível duplicata/homônimo)';

        duplicateGroups.push({
          reason,
          key: `Nome: "${name.toUpperCase()}"`,
          athletes: list,
        });

        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            groupedPairs.add(pairKey(list[i].id, list[j].id));
          }
        }
      }
    }

    // Probes adicionais com dedup.ts (ex: sameLast2AndDob para nomes diferentes)
    for (let i = 0; i < athletes.length; i++) {
      for (let j = i + 1; j < athletes.length; j++) {
        const a = athletes[i];
        const b = athletes[j];
        if (groupedPairs.has(pairKey(a.id, b.id))) continue;

        const probeA: PlayerProbe = {
          id: a.id,
          name: a.name,
          cpfHash: a.cpfHash,
          cpfLast2: a.cpfLast2,
          birthDate: a.birthDate,
        };
        const probeB: PlayerProbe = {
          id: b.id,
          name: b.name,
          cpfHash: b.cpfHash,
          cpfLast2: b.cpfLast2,
          birthDate: b.birthDate,
        };

        if (sameLast2AndDob(probeA, probeB)) {
          duplicateGroups.push({
            reason: 'Mesmo Final de CPF (Last2) e Mesma Data de Nascimento (sameLast2AndDob)',
            key: `Last2: **${a.cpfLast2} | Nasc: ${a.birthDate?.toISOString().split('T')[0]}`,
            athletes: [a, b],
          });
          groupedPairs.add(pairKey(a.id, b.id));
        }
      }
    }

    // Relatório Final
    console.log('------------------------------------------------------------');
    console.log(`RELATÓRIO DE DUPLICIDADES PARA O CT: ${ct.name}`);
    console.log(`Total de grupos de duplicidade encontrados: ${duplicateGroups.length}`);
    console.log('------------------------------------------------------------\n');

    if (duplicateGroups.length === 0) {
      console.log('✔ NENHUM ATLETA REPETIDO OU EM DUPLICIDADE ENCONTRADO PARA ESTE CT.');
      return;
    }

    duplicateGroups.forEach((group, index) => {
      console.log(`[GRUPO ${index + 1}] Motivo: ${group.reason}`);
      console.log(`Critério: ${group.key}`);
      console.log('Atletas envolvidos:');
      group.athletes.forEach((ath, aIdx) => {
        const dobStr = ath.birthDate ? ath.birthDate.toISOString().split('T')[0] : 'Não informada';
        const cpfStr = ath.cpf || ath.userCpf || (ath.cpfLast2 ? `***.***.***-${ath.cpfLast2}` : 'Não informado');
        const emailStr = ath.email || ath.userEmail || 'Não informado';
        const userAccountStr = ath.userId ? `SIM (UserId: ${ath.userId})` : 'NÃO';
        const mergedStr = ath.mergedIntoId ? `[JÁ MESCLADO -> ${ath.mergedIntoId}]` : '[ATIVO/NÃO MESCLADO]';

        console.log(`  ${aIdx + 1}. ID: ${ath.id} ${mergedStr}`);
        console.log(`     Nome: ${ath.name}`);
        console.log(`     Data Nasc: ${dobStr} | Idade: ${ath.age ?? '-'}`);
        console.log(`     CPF: ${cpfStr} | Hash: ${ath.cpfHash ? ath.cpfHash.slice(0, 10) + '...' : '-'}`);
        console.log(`     Email: ${emailStr}`);
        console.log(`     Conta de Usuário vinculada: ${userAccountStr}`);
        console.log(`     Partidas disputadas: ${ath.matchesCount}`);
        console.log(`     Vínculo CT: Status=${ath.ctStatus}, Desde=${ath.since.toISOString().split('T')[0]}`);
        console.log(`     Cadastrado em: ${ath.createdAt.toISOString()}`);
        console.log('');
      });
      console.log('------------------------------------------------------------');
    });

    console.log('\nFim do relatório de duplicidades.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('[ERRO FATAL NA EXECUÇÃO]:', err);
  process.exit(1);
});
