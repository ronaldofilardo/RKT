'use client';

interface StatsCardProps {
  label: string;
  value: number | string;
}

export function StatsCard({ label, value }: StatsCardProps) {
  return (
    <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 p-4">
      <p className="text-xs font-medium text-telemetry-text-muted uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-telemetry-text-primary">{value}</p>
    </div>
  );
}
