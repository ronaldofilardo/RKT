import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

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
    <main className="min-h-screen bg-telemetry-base text-telemetry-text-primary flex items-center justify-center p-4">
      <div className="bg-telemetry-card border border-telemetry-border/30 rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="space-y-2 border-b border-telemetry-border/20 pb-4">
          <span className="text-xs uppercase tracking-wider font-semibold text-telemetry-blue bg-telemetry-blue/10 px-2.5 py-1 rounded-full">
            Ciência de Ativação de Conta
          </span>
          <h1 className="text-xl font-bold text-telemetry-text-primary">
            Comunicação ao Responsável Legal
          </h1>
          <p className="text-xs text-telemetry-text-muted">
            Este é um comunicado informativo. Nenhuma ação adicional é exigida.
          </p>
        </div>

        <div className="bg-telemetry-elevated/40 border border-telemetry-border/20 rounded-xl p-4 space-y-3 text-sm">
          <div className="flex justify-between items-center text-xs">
            <span className="text-telemetry-text-muted">Atleta:</span>
            <span className="font-semibold text-telemetry-text-primary">{minorName}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-telemetry-text-muted">Responsável que autorizou:</span>
            <span className="font-semibold text-telemetry-text-primary">{guardianName}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-telemetry-text-muted">Clube / Centro:</span>
            <span className="font-semibold text-telemetry-text-primary">{ctName}</span>
          </div>
        </div>

        <div className="space-y-3 text-xs text-telemetry-text-muted leading-relaxed">
          <p>
            Informamos que a conta do atleta <strong className="text-telemetry-text-primary">{minorName}</strong> foi cadastrada pelo clube com base na autorização prévia já fornecida.
          </p>
          <p>
            O atleta recebeu um link individual para ativar sua senha e acessar as informações de treinos, estatísticas e acompanhamento de partidas de raquete no aplicativo RKT.
          </p>
        </div>

        <div className="pt-2 border-t border-telemetry-border/20 text-[11px] text-telemetry-text-muted text-center">
          RKT Gestão Esportiva — Conformidade com ECA Digital e LGPD
        </div>
      </div>
    </main>
  );
}
