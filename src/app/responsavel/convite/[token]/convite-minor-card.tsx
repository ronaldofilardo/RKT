'use client';

interface ConviteMinorCardProps {
  minorName: string;
  trainingCenterName: string;
}

export function ConviteMinorCard({ minorName, trainingCenterName }: ConviteMinorCardProps) {
  return (
    <div className="bg-telemetry-elevated/40 border border-telemetry-border/30 rounded-xl p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-telemetry-blue">
          Atleta Menor Sob Sua Tutela
        </span>
        <span className="text-[10px] bg-amber-500/10 text-amber-400 font-semibold px-2 py-0.5 rounded">
          Autorização Pendente
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-telemetry-border/20 pb-2">
        <span className="text-base font-bold text-telemetry-text-primary">
          {minorName}
        </span>
        <span className="text-xs text-telemetry-text-muted">
          Clube / CT: <strong className="text-telemetry-text-primary">{trainingCenterName}</strong>
        </span>
      </div>

      <p className="text-[11px] text-telemetry-text-muted leading-relaxed">
        Você está autorizando o atleta menor <strong className="text-telemetry-text-primary">{minorName}</strong> no Centro de Treinamento <strong className="text-telemetry-text-primary">{trainingCenterName}</strong>. Suas autorizações regem o tratamento de dados esportivos, acompanhamento e estatísticas sob o ECA Digital (Lei 15.211/2025) e LGPD.
      </p>
    </div>
  );
}
