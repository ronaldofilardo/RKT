import { useRouter } from 'next/navigation';

interface AthleteSearchHeaderProps {
  athleteCount: number;
  onNewAthlete: () => void;
}

export function AthleteSearchHeader({ athleteCount, onNewAthlete }: AthleteSearchHeaderProps) {
  const router = useRouter();
  
  return (
    <header className="bg-telemetry-base shadow-sm border-b border-white/10 sticky top-0 z-10 safe-top">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            aria-label="Voltar para o dashboard"
            className="text-telemetry-text-muted hover:text-telemetry-text-primary transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-telemetry-text-primary">Atletas</h1>
          <span className="bg-telemetry-blue/20 text-telemetry-blue text-xs font-semibold px-2 py-1 rounded-full">
            {athleteCount}
          </span>
        </div>
        <button
          onClick={onNewAthlete}
          className="inline-flex items-center gap-2 px-4 py-2 bg-telemetry-blue text-white font-medium rounded-lg hover:opacity-90 transition-colors shadow-sm shadow-telemetry-blue/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Atleta
        </button>
      </div>
    </header>
  );
}
