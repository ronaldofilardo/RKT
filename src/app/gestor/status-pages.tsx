'use client';

export function PendingStatus() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-telemetry-base">
      <div className="bg-telemetry-card rounded-2xl shadow-lg border border-telemetry-border/20 p-8 w-full max-w-md text-center">
        <h2 className="text-xl font-bold text-telemetry-text-primary mb-2">Seu clube está em análise</h2>
        <p className="text-sm text-telemetry-text-muted mb-6">
          Assim que o suporte aprovar seu clube, você terá acesso completo ao painel.
        </p>
      </div>
    </div>
  );
}

export function SuspendedStatus() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-telemetry-base">
      <div className="bg-telemetry-card rounded-2xl shadow-lg border border-telemetry-border/20 p-8 w-full max-w-md text-center">
        <h2 className="text-xl font-bold text-telemetry-text-primary mb-2">Acesso suspenso</h2>
        <p className="text-sm text-telemetry-text-muted mb-6">
          Seu acesso foi suspenso. Fale com o suporte para saber mais.
        </p>
      </div>
    </div>
  );
}
