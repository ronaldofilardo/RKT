import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { Rankings } from '@/schemas/contracts';
import { getAutoCategoryForAge } from '@/lib/ranking/rankingConstants';
import { hashCpf } from '@/core/athlete/cpf';
import { generateUniqueAthleteCode } from '@/core/athlete/athlete-code';

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

  const athleteCode = await generateUniqueAthleteCode(async (code) => {
    const existing = await prisma.player.findFirst({ where: { athleteCode: code }, select: { id: true } });
    return Boolean(existing);
  });

  // Categoria automática (ESTADUAL) a partir da idade calculada
  let rankingsPayload: Record<string, unknown> = data.rankings ? { ...data.rankings } : {};
  if (age !== undefined && age >= 11 && !rankingsPayload.ESTADUAL) {
    const autoCats = getAutoCategoryForAge('ESTADUAL', age);
    if (autoCats.length > 0) {
      rankingsPayload.ESTADUAL = { category: autoCats[0] };
    }
  }

  const player = await prisma.player.create({
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
      cpfHash,
      cpfLast2,
      identityStatus: data.createdByUserId ? 'CONFIRMED' : 'PROVISIONAL',
      athleteCode,
    },
    select: { id: true, name: true, gender: true, age: true, birthDate: true, dominance: true, backhand: true, ranking: true, rankings: true, club: true, cpfHash: true, cpfLast2: true, identityStatus: true, athleteCode: true, userId: true, createdByUserId: true },
  });

  if (data.myClub && data.ctId && data.actorProfile) {
    const status = data.actorProfile === 'ATLETA' ? 'PENDING' : 'ACTIVE';
    await prisma.playerCT.create({
      data: { playerId: player.id, ctId: data.ctId, status },
    });
  }

  return player;
}
