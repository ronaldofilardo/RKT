import Link from 'next/link';

interface ConviteSuccessCardProps {
  minorName: string;
  token: string;
}

export function ConviteSuccessCard({ minorName, token }: ConviteSuccessCardProps) {
  return (
    <main className="min-h-screen bg-telemetry-base text-telemetry-text-primary flex items-center justify-center p-4 sm:p-6">
      <div className="bg-telemetry-card border border-telemetry-border/30 rounded-2xl max-w-md w-full p-6 sm:p-8 text-center space-y-4 shadow-2xl">
        <div className="text-5xl">✅</div>
        <h1 className="text-xl font-bold text-telemetry-text-primary">Autorização Confirmada com Sucesso!</h1>
        <p className="text-xs text-telemetry-text-muted">
          Os dados e autorizações do atleta menor <strong>{minorName}</strong> foram registrados conforme o ECA Digital e a LGPD.
        </p>

        <div className="bg-telemetry-elevated/40 border border-telemetry-border/30 rounded-xl p-3.5 text-xs text-telemetry-text-muted space-y-1.5 text-left">
          <span className="font-semibold text-telemetry-text-primary flex items-center gap-1.5">
            <span>📩</span> Próximos Passos:
          </span>
          <p className="text-[11px] leading-relaxed">
            O gestor do clube enviará um link ao atleta menor <strong>{minorName}</strong> para que ele habilite a própria conta. Você já pode criar sua conta de responsável ou fazer login agora mesmo.
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          <Link
            href={`/responsavel/aviso-ativacao/${token}` as any}
            className="block w-full bg-telemetry-blue hover:bg-telemetry-blue/90 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors shadow-sm"
          >
            Criar / Ativar Conta de Responsável
          </Link>
          <Link
            href="/login"
            className="block w-full border border-telemetry-border/30 hover:border-telemetry-blue/50 text-telemetry-text-primary font-medium py-2.5 px-4 rounded-lg text-xs transition-colors"
          >
            Já tenho conta • Fazer Login
          </Link>
        </div>
      </div>
    </main>
  );
}
