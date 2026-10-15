'use client';

type SyncStatus = 'offline' | 'syncing' | 'synced' | 'auth-required';

const BANNER: Record<Exclude<SyncStatus, 'synced'>, { className: string; text: string }> = {
  offline: {
    className: 'bg-amber-600',
    text: '🔴 Modo Offline — sincronizando ao reconectar',
  },
  'auth-required': {
    className: 'bg-red-600',
    text: '🔐 Sessão expirada — faça login novamente para sincronizar os pontos',
  },
  syncing: {
    className: 'bg-blue-600',
    text: '🔄 Sincronizando pontos pendentes...',
  },
};

export function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" />
    </div>
  );
}

export function ErrorScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <p className="text-red-600 font-semibold">{message}</p>
        <button onClick={onBack} className="mt-4 text-sky-600 underline">
          Voltar ao dashboard
        </button>
      </div>
    </div>
  );
}

/** Faixa de status de sincronização (oculta quando tudo está sincronizado). */
export function SyncStatusBanner({ syncStatus }: { syncStatus: SyncStatus }) {
  if (syncStatus === 'synced') return null;
  const banner = BANNER[syncStatus];
  return (
    <div
      data-testid="sync-status"
      data-sync-state={syncStatus}
      role="status"
      aria-live="polite"
      className={`text-white text-center text-sm py-1 px-4 font-semibold ${banner.className}`}
    >
      {banner.text}
    </div>
  );
}

/** Overlay exibido enquanto o histórico completo da timeline é buscado. */
export function TimelineLoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-telemetry-card border border-white/10 rounded-2xl px-6 py-5 flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
        <p className="text-sm text-telemetry-text-primary font-medium">
          Carregando linha do tempo completa...
        </p>
      </div>
    </div>
  );
}
