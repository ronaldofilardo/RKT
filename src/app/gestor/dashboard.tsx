'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAreaPath } from '@/hooks/use-area-path';
import type { MeResponse, CoachItem, AthleteItem, ClubMatchItem, GestorTab, MemberType } from './types';
import { TabNav } from './tab-nav';
import { CoachesTable } from './coaches-table';
import { AthletesTable } from './athletes-table';
import { ClubMatchesTable } from './club-matches-table';
import { ClubInfo } from './club-info';
import { CadastrarMembroModal } from './cadastrar-membro-modal';
import { DashboardHeader } from './dashboard-header';
import { NewAthleteModal } from '@/app/match/new/components/NewAthleteModal';
import { IndicarAnotadorModal } from './indicar-anotador-modal';
import { DashboardChrome } from '@/app/dashboard/components/DashboardChrome';
import { requestDeleteMatch, requestAnnotateMatch } from './gestor-match-actions.logic';

interface GestorDashboardProps {
  me: MeResponse;
  tab: GestorTab;
  setTab: (tab: GestorTab) => void;
}

export function GestorDashboard({ me, tab, setTab }: GestorDashboardProps) {
  const router = useRouter();
  const toAreaPath = useAreaPath();
  const [coaches, setCoaches] = useState<CoachItem[]>([]);
  const [athletes, setAthletes] = useState<AthleteItem[]>([]);
  const [matches, setMatches] = useState<ClubMatchItem[]>([]);
  const [externalMatches, setExternalMatches] = useState<ClubMatchItem[]>([]);
  const [coachSelected, setCoachSelected] = useState<string[]>([]);
  const [athleteSelected, setAthleteSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [cadastroType, setCadastroType] = useState<MemberType>('TREINADOR');
  const [newAthleteOpen, setNewAthleteOpen] = useState(false);
  const [matchToAssign, setMatchToAssign] = useState<ClubMatchItem | null>(null);

  const gestorCtId = me.memberships.find((m) => m.kind === 'GESTOR' && m.status === 'ACTIVE')?.ctId
    ?? me.memberships.find((m) => m.kind === 'GESTOR')?.ctId ?? null;

  const fetchCoachesData = useCallback(async () => {
    try {
      const res = await fetch('/api/gestor/coaches', { cache: 'no-store' });
      if (res.ok) { const d = await res.json(); setCoaches(d.items || []); }
    } catch {}
  }, []);

  const fetchAthletesData = useCallback(async () => {
    try {
      const res = await fetch('/api/gestor/athletes', { cache: 'no-store' });
      if (res.ok) { const d = await res.json(); setAthletes(d.items || []); }
    } catch {}
  }, []);

  const fetchMatchesData = useCallback(async () => {
    try {
      const res = await fetch('/api/gestor/matches', { cache: 'no-store' });
      if (res.ok) {
        const d = await res.json();
        setMatches(d.items || []);
        setExternalMatches(d.externalItems || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchCoachesData(), fetchAthletesData(), fetchMatchesData()]).finally(() => setLoading(false));
  }, [fetchCoachesData, fetchAthletesData, fetchMatchesData]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telemetry-blue" /></div>;

  return (
    <div className="min-h-screen bg-telemetry-base">
      <DashboardChrome title="Painel do Gestor" showMenu={false} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardHeader me={me} />
        <TabNav tab={tab} onTabChange={setTab} coachesCount={coaches.length} athletesCount={athletes.length} matchesCount={matches.length} />
        <div className="space-y-6">
          {tab === 'coaches' && <CoachesTable coaches={coaches} selectedIds={coachSelected} onSelectChange={(id, chk) => setCoachSelected((p) => chk ? [...p, id] : p.filter((x) => x !== id))} onSelectAll={(chk) => setCoachSelected(chk ? coaches.map((c) => c.user.id) : [])} onCreateCoach={() => { setCadastroType('TREINADOR'); setCadastroOpen(true); }} onRefresh={fetchCoachesData} />}
          {tab === 'athletes' && <AthletesTable athletes={athletes} selectedIds={athleteSelected} onSelectChange={(id, chk) => setAthleteSelected((p) => chk ? [...p, id] : p.filter((x) => x !== id))} onSelectAll={(chk) => setAthleteSelected(chk ? athletes.map((a) => a.player.id) : [])} onCreateAthlete={() => setNewAthleteOpen(true)} onRefresh={fetchAthletesData} />}
          {tab === 'matches' && (
            <ClubMatchesTable
              matches={matches} externalMatches={externalMatches} currentUserId={me.user.id}
              onCreateMatch={() => router.push(toAreaPath('/match/new') as any)} onAssignCoach={setMatchToAssign}
              onDeleteMatch={async (m) => { const ok = await requestDeleteMatch(m); if (ok) fetchMatchesData(); }}
              onAnnotateMatch={(m) => requestAnnotateMatch(m, (path) => router.push(toAreaPath(path) as any))}
            />
          )}
          {tab === 'club' && <ClubInfo />}
        </div>
        <CadastrarMembroModal open={cadastroOpen} onOpenChange={setCadastroOpen} initialType={cadastroType} fixedType={cadastroType} onSave={() => { fetchCoachesData(); fetchAthletesData(); }} />
        <NewAthleteModal isOpen={newAthleteOpen} onClose={() => setNewAthleteOpen(false)} onCreated={() => { setNewAthleteOpen(false); fetchAthletesData(); }} myClub ctId={gestorCtId} />
        <IndicarAnotadorModal open={Boolean(matchToAssign)} onOpenChange={(op) => !op && setMatchToAssign(null)} match={matchToAssign} coaches={coaches} onSuccess={fetchMatchesData} />
      </div>
    </div>
  );
}
