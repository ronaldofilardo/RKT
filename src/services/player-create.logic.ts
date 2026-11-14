import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Rankings } from '@/schemas/contracts';
import { getAutoCategoryForAge } from '@/lib/ranking/rankingConstants';
import { hashCpf } from '@/core/athlete/cpf';
import { generateUniqueAthleteCode } from '@/core/athlete/athlete-code';
import { normalizeNickname } from '@/core/athlete/nickname';
import { createPlayerRow } from './player-create-row.logic';
import { handlePlayerPostCreate } from './player-create-links.logic';
import { tryResolveExistingPlayer } from './player-create-existing.logic';

type CreatePlayerActor = 'ATLETA' | 'GESTOR' | 'TREINADOR' | null;

export async function createPlayer(data: {
  name: string;
  email?: string;
  club?: string;
  gender?: string;
  age?: number;
  birthDate?: Date;
  birthYear?: number;
  dominance?: string;
  backhand?: string;
  ranking?: number;
  rankings?: Rankings;
  createdByUserId?: string;
  cpf?: string | null;
  myClub?: boolean;
  ctId?: string | null;
  nickname?: string | null;
  actorProfile?: CreatePlayerActor;
}) {
  const pepper = process.env.CPF_HASH_PEPPER ?? '';
  const cpfHash = data.cpf ? hashCpf(data.cpf, pepper) : null;
  const cpfLast2 = data.cpf ? data.cpf.replace(/\D/g, '').slice(-2) : null;

  const currentYear = new Date().getFullYear();
  const age = data.age
    ?? (data.birthDate
      ? currentYear - data.birthDate.getFullYear()
      : data.birthYear
        ? currentYear - data.birthYear
        : undefined);

  let rankingsPayload: Record<string, unknown> = data.rankings ? { ...data.rankings } : {};
  if (age !== undefined && age >= 11 && !rankingsPayload.ESTADUAL) {
    const autoCats = getAutoCategoryForAge('ESTADUAL', age);
    if (autoCats.length > 0) {
      rankingsPayload.ESTADUAL = { category: autoCats[0] };
    }
  }

  const nickname = data.nickname ? normalizeNickname(data.nickname) : null;
  if (nickname) {
    const resolved = await tryResolveExistingPlayer({ nickname, data: { ...data, rankingsPayload, cpfHash, cpfLast2 } });
    if (resolved) return resolved;
  }

  const athleteCode = await generateUniqueAthleteCode(async (code) => {
    const existing = await prisma.player.findFirst({ where: { athleteCode: code }, select: { id: true } });
    return Boolean(existing);
  });

  const player = await createPlayerRow({
    data: {
      name: data.name,
      email: data.email || null,
      club: data.club || null,
      gender: data.gender,
      age,
      birthDate: data.birthDate,
      dominance: data.dominance,
      backhand: data.backhand,
      ranking: data.ranking,
      rankings: rankingsPayload as unknown as Prisma.InputJsonValue,
      createdByUserId: data.createdByUserId,
      cpf: data.cpf ? data.cpf.replace(/\D/g, '') : null,
      cpfHash,
      cpfLast2,
      identityStatus: data.createdByUserId ? 'CONFIRMED' : 'PROVISIONAL',
      athleteCode,
      nickname,
    },
    select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true, club: true, cpfHash: true, cpfLast2: true, identityStatus: true, athleteCode: true, nickname: true, poolVisible: true, userId: true, createdByUserId: true },
  });

  await handlePlayerPostCreate({
    player: { ...player, cpf: data.cpf },
    myClub: data.myClub,
    ctId: data.ctId,
    createdByUserId: data.createdByUserId,
    actorProfile: data.actorProfile,
  });

  return player;
}
