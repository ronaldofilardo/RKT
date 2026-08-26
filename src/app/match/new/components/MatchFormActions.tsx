'use client';

export function MatchFormActions({ loading }: { loading: boolean }) {
  return <div className="flex gap-3 pt-4"><button type="button" onClick={() => window.history.back()} className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button><button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-sm">{loading ? 'Criando...' : 'Criar Partida'}</button></div>;
}
