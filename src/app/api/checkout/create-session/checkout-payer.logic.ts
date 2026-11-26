import { prisma } from '@/lib/prisma';

export interface PayerInfo {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string | null;
  externalReference: string;
  isCt: boolean;
  ctId?: string | null;
}

export async function resolveCheckoutPayer(
  userId: string,
  dependentPlayerId?: string,
): Promise<PayerInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      cpf: true,
      email: true,
      memberships: { where: { status: 'ACTIVE' }, select: { kind: true, ctId: true, ct: true } },
      guardianLinks: { where: { status: 'ACTIVE' }, select: { playerId: true } },
    },
  });

  if (!user) throw new Error('Usuário autenticado não encontrado no banco.');

  // Caso 1: CT / Gestor
  const gestorMem = user.memberships.find((m) => m.kind === 'GESTOR' && m.ctId);
  if (gestorMem?.ct) {
    return {
      name: gestorMem.ct.legalName || gestorMem.ct.name,
      cpfCnpj: gestorMem.ct.cnpj || user.cpf || '',
      email: gestorMem.ct.email || user.email,
      phone: gestorMem.ct.phone,
      externalReference: `CT:${gestorMem.ct.id}`,
      isCt: true,
      ctId: gestorMem.ct.id,
    };
  }

  // Caso 2: Responsável pagando por atleta menor dependente (ECA Digital)
  if (dependentPlayerId) {
    const isGuardian = user.guardianLinks.some((l) => l.playerId === dependentPlayerId);
    if (!isGuardian) {
      throw new Error('Você não possui tutela autorizada sobre este dependente.');
    }
  }

  // Caso 3: Pessoa Física (Atleta maior, Treinador particular ou Responsável)
  if (!user.cpf) {
    throw new Error('CPF obrigatório para emissão de cobrança bancária no Asaas.');
  }

  return {
    name: user.name,
    cpfCnpj: user.cpf,
    email: user.email,
    externalReference: `USER:${user.id}`,
    isCt: false,
  };
}
