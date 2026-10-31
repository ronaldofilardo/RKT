import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { reportApiError } from '@/lib/api.logic';
import { formatZodMessage } from '@/lib/api-response.logic';
import { withAccessHandler } from '@/lib/access-handler';
import { getGestorCtId, denyGestor } from '../../_logic';
import { PatchSchema } from './patch-logic';
import { getCpfLast2, hashCpf } from '@/core/athlete/cpf';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctId = await getGestorCtId(request);
  if (!ctId) return denyGestor('Gestor não encontrado');

  return withAccessHandler(
    request,
    'platform:memberships:manage',
    () => ({ ctId }),
    async ({ user }) => {
      try {
        const { id } = await params;
        const body = await request.json().catch(() => null);
        const parsed = PatchSchema.safeParse(body);
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'VALIDATION_ERROR', message: formatZodMessage(parsed.error), details: parsed.error.flatten() },
            { status: 400 },
          );
        }

        const playerCT = await prisma.playerCT.findFirst({
          where: { OR: [{ id }, { playerId: id }, { player: { userId: id } }], ctId },
          include: { player: { include: { user: true } } },
        });
        if (!playerCT) {
          return NextResponse.json(
            { error: 'NOT_FOUND', message: 'Atleta não encontrado' },
            { status: 404 },
          );
        }

        // Atleta pode existir sem conta de acesso (ex.: cadastrado só com ano de nascimento).
        // Nesse caso edita-se apenas o Player; nome/CPF do User só quando houver conta.
        const userId = playerCT.player.user ? playerCT.player.userId : null;
        const cpfDigits = parsed.data.cpf.replace(/\D/g, '');
        if (userId && cpfDigits.length !== 11) {
          return NextResponse.json(
            { error: 'VALIDATION_ERROR', message: 'cpf: CPF inválido', details: { formErrors: [], fieldErrors: { cpf: ['CPF inválido'] } } },
            { status: 400 },
          );
        }

        // Atleta sem conta: o CPF só existe como hash + 2 últimos dígitos no Player.
        // CPF vazio mantém o valor atual; informado, substitui. Mesma regra do atleta com conta
        // (11 dígitos, sem checagem de dígitos verificadores).
        let cpfData: { cpf: string; cpfHash: string; cpfLast2: string } | Record<string, never> = {};
        if (!userId && cpfDigits) {
          cpfData = { cpf: cpfDigits, cpfHash: hashCpf(cpfDigits, process.env.CPF_HASH_PEPPER ?? ''), cpfLast2: getCpfLast2(cpfDigits) };
        }

        // Ano lido da string (evita deslocamento de fuso de new Date('YYYY-MM-DD')).
        const birthYear = Number(/^(\d{4})/.exec(parsed.data.birthDate)?.[1]) || null;

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              name: parsed.data.name,
              cpf: parsed.data.cpf.replace(/\D/g, ''),
            },
          });
        }

        await prisma.player.update({
          where: { id: playerCT.player.id },
          data: {
            name: parsed.data.name,
            gender: parsed.data.gender,
            dominance: parsed.data.dominance,
            birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
            ...(birthYear ? { age: new Date().getFullYear() - birthYear } : {}),
            ...cpfData,
          },
        });

        await prisma.auditLog.create({
          data: {
            actorUserId: user.id,
            action: 'ATLETA_DADOS_ATUALIZADOS',
            resourceType: 'Player',
            resourceId: playerCT.player.id,
            ctId,
            meta: { name: parsed.data.name, cpf: parsed.data.cpf, gender: parsed.data.gender },
          },
        });

        return NextResponse.json({ ok: true }, { status: 200 });
      } catch (error) {
        logger.error('[ATHLETE PATCH]', error);
        return reportApiError(error);
      }
    },
  );
}
