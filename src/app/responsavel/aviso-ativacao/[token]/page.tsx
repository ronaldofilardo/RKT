import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { AvisoAtivacaoForm } from './aviso-ativacao-form';

export default async function AvisoAtivacaoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tokenHash = createHash('sha256').update(token).digest('hex');

  const invite = await prisma.guardianInvite.findUnique({
    where: { tokenHash },
    include: {
      player: { select: { id: true, name: true } },
      ct: { select: { id: true, name: true } },
    },
  });

  const isExpired = !invite || new Date() > invite.expiresAt;

  if (isExpired) {
    return (
      <main className="min-h-screen bg-telemetry-base text-telemetry-text-primary flex items-center justify-center p-4">
        <div className="bg-telemetry-card border border-telemetry-border/30 rounded-2xl max-w-md w-full p-6 text-center space-y-4">
          <div className="text-3xl">⚠️</div>
          <h1 className="text-lg font-bold">Link Expirado ou Inválido</h1>
          <p className="text-sm text-telemetry-text-muted">
            Este comunicado de ativação não está mais disponível ou expirou. Em caso de dúvidas, consulte a administração do seu clube.
          </p>
        </div>
      </main>
    );
  }

  const minorName = invite.player?.name ?? 'Atleta';
  const guardianName = invite.preGuardianName ?? 'Responsável Legal';
  const ctName = invite.ct?.name ?? 'Clube de Treinamento';

  return (
    <main className="min-h-screen bg-telemetry-base text-telemetry-text-primary flex items-center justify-center p-4 sm:p-6">
      <div className="bg-telemetry-card border border-telemetry-border/30 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
        <div className="space-y-1.5 border-b border-telemetry-border/20 pb-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-telemetry-blue bg-telemetry-blue/10 px-2.5 py-0.5 rounded-full">
            ECA Digital • Ativação de Responsável
          </span>
          <h1 className="text-xl font-bold text-telemetry-text-primary">
            Ativação de Conta do Responsável Legal
          </h1>
          <p className="text-xs text-telemetry-text-muted">
            Olá, <strong>{guardianName}</strong>! Sua autorização para <strong>{minorName}</strong> no <strong>{ctName}</strong> foi confirmada.
          </p>
        </div>

        <AvisoAtivacaoForm token={token} minorName={minorName} guardianName={guardianName} />

        <div className="pt-2 border-t border-telemetry-border/20 text-[11px] text-telemetry-text-muted text-center">
          RKT Gestão Esportiva — Tutela e Proteção de Dados (ECA Digital e LGPD)
        </div>
      </div>
    </main>
  );
}
