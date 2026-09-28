'use client';

export function MatchFormActions({ loading }: { loading: boolean }) {
  return <div className="flex gap-3 pt-4"><button type="button" onClick={() => window.history.back()} className="flex-1 px-4 py-3 bg-telemetry-elevated border border-white/10 text-telemetry-text-primary font-semibold rounded-lg hover:bg-white/5 transition-colors">Cancelar</button><button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-telemetry-active text-white font-semibold rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-sm">{loading ? 'Criando...' : 'Criar Partida'}</button></div>;
}
