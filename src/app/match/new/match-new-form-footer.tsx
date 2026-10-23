'use client';

export function MatchNewFormFooter({ loading }: { loading: boolean }) {
  return (
    <div className="flex gap-3 pt-4">
      <button
        type="button"
        onClick={() => window.history.back()}
        className="flex-1 px-4 py-3 bg-transparent border border-white/10 text-telemetry-text-muted font-semibold rounded-lg hover:bg-white/5 hover:text-telemetry-text-primary transition-colors"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={loading}
        className="flex-1 px-4 py-3 bg-telemetry-blue text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors shadow-sm"
      >
        {loading ? 'Criando...' : 'Criar Partida'}
      </button>
    </div>
  );
}
