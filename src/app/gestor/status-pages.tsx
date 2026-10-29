'use client';

export function PendingStatus() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-telemetry-base">
      <div className="bg-telemetry-card rounded-2xl shadow-lg border border-telemetry-border/20 p-8 w-full max-w-md text-center">
        <h2 className="text-xl font-bold text-telemetry-text-primary mb-2">Clube em Análise</h2>
        <p className="text-sm text-telemetry-text-muted mb-6">
          Seu clube ainda está sendo analisado pelo Suporte. Assim que aprovado, você terá acesso ao painel do Gestor.
        </p>
        <p className="text-xs text-telemetry-text-muted">Status: Pendente de aprovação</p>
      </div>
    </div>
  );
}

export function SuspendedStatus() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-telemetry-base">
      <div className="bg-telemetry-card rounded-2xl shadow-lg border border-telemetry-border/20 p-8 w-full max-w-md text-center">
        <h2 className="text-xl font-bold text-telemetry-text-primary mb-2">Clube Suspenso</h2>
        <p className="text-sm text-telemetry-text-muted mb-6">
          O acesso ao seu clube foi suspenso. Entre em contato com o Suporte para mais informações.
        </p>
      </div>
    </div>
  );
}
