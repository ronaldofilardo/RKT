'use client';

export function AvulsosSection() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-telemetry-text-primary mb-4">Contas Avulsas</h2>
      <p className="text-sm text-telemetry-text-muted mb-4">Usuários sem vínculo ativo a clubes/CTs.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-telemetry-card rounded-lg p-4 border border-telemetry-border/20">
          <h3 className="text-sm font-semibold text-telemetry-text-primary mb-2">Atletas Avulsos</h3>
          <p className="text-xs text-telemetry-text-muted">Atletas sem registro em PlayerCT.</p>
        </div>
        <div className="bg-telemetry-card rounded-lg p-4 border border-telemetry-border/20">
          <h3 className="text-sm font-semibold text-telemetry-text-primary mb-2">Treinadores Avulsos</h3>
          <p className="text-xs text-telemetry-text-muted">Treinadores sem ctId ativo.</p>
        </div>
        <div className="bg-telemetry-card rounded-lg p-4 border border-telemetry-border/20">
          <h3 className="text-sm font-semibold text-telemetry-text-primary mb-2">Espectadores Avulsos</h3>
          <p className="text-xs text-telemetry-text-muted">Usuários sem vínculos a CTs.</p>
        </div>
      </div>
    </div>
  );
}
