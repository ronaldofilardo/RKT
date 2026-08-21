import { useParams, useRouter } from 'next/navigation';
import { useScoringPageState } from './useScoringPageState';
import { useScoringPageEffects } from './useScoringPageEffects';
import { useScoringPageDerived } from './useScoringPageDerived';
import { ScoringScreen, TimelineScreen } from './ScoringPage.views';

function LoadingScreen() {
  return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600" /></div>;
}

function ErrorScreen({ message, onBack }: { message: string; onBack: () => void }) {
  return <div className="flex items-center justify-center h-screen"><div className="text-center"><p className="text-red-600 font-semibold">{message}</p><button onClick={onBack} className="mt-4 text-sky-600 underline">Voltar ao dashboard</button></div></div>;
}

export default function ScoringPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  const state = useScoringPageState(matchId);
  const handlers = useScoringPageEffects(state);
  const derived = useScoringPageDerived(state, handlers);

  if (state.isLoading) return <LoadingScreen />;
  if (state.error || !state.match) return <ErrorScreen message={state.error || 'Partida não encontrada'} onBack={() => router.push('/dashboard')} />;

  const data = { matchId, router, state, handlers, derived, match: state.match };
  if (state.viewMode === 'timeline' && !derived.isSetupNeeded && state.activeModal === null) {
    return <TimelineScreen data={{ ...data, elapsed: state.elapsed, fontScale: state.fontScale, timelinePoints: derived.timelinePoints, isFinished: derived.isFinished, abandonCurrentSession: handlers.abandonCurrentSession, setViewMode: state.setViewMode }} />;
  }
  return <ScoringScreen data={data} />;
}
