'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MeResponse, CoachItem, AthleteItem, ClubMatchItem, GestorTab, MemberType } from './types';
import { TabNav } from './tab-nav';
import { CoachesTable } from './coaches-table';
import { AthletesTable } from './athletes-table';
import { ClubMatchesTable } from './club-matches-table';
import { ClubInfo } from './club-info';
import { ManagersSection } from './managers-section';
import { CadastrarMembroModal } from './cadastrar-membro-modal';
import { DashboardHeader } from './dashboard-header';
import { NewAthleteModal } from '@/app/match/new/components/NewAthleteModal';

interface GestorDashboardProps {
  me: MeResponse;
  tab: GestorTab;
  setTab: (tab: GestorTab) => void;
}

export function GestorDashboard({ me, tab, setTab }: GestorDashboardProps) {
  const [coaches, setCoaches] = useState<CoachItem[]>([]);
  const [athletes, setAthletes] = useState<AthleteItem[]>([]);
  const [matches, setMatches] = useState<ClubMatchItem[]>([]);
  const [coachSelected, setCoachSelected] = useState<string[]>([]);
  const [athleteSelected, setAthleteSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [cadastroType, setCadastroType] = useState<MemberType>('TREINADOR');
  const [newAthleteOpen, setNewAthleteOpen] = useState(false);

  const fetchCoachesData = useCallback(async () => {
    try {
      const res = await fetch('/api/gestor/coaches');
      if (res.ok) { const d = await res.json(); setCoaches(d.items || []); }
    } catch {}
  }, []);

  const fetchAthletesData = useCallback(async () => {
    try {
      const res = await fetch('/api/gestor/athletes');
      if (res.ok) { const d = await res.json(); setAthletes(d.items || []); }
    } catch {}
  }, []);

  const fetchMatchesData = useCallback(async () => {
    try {
      const res = await fetch('/api/gestor/matches');
      if (res.ok) { const d = await res.json(); setMatches(d.items || []); }
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchCoachesData(), fetchAthletesData(), fetchMatchesData()]).finally(() => setLoading(false));
  }, [fetchCoachesData, fetchAthletesData, fetchMatchesData]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telemetry-blue" /></div>;

  return (
    <div className="min-h-screen bg-telemetry-base">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardHeader me={me} coachesCount={coaches.length} athletesCount={athletes.length} matchesCount={matches.length} />
        <TabNav tab={tab} onTabChange={setTab} matchesCount={matches.length} />
        <div className="space-y-6">
          {tab === 'coaches' && (
            <CoachesTable coaches={coaches} selectedIds={coachSelected} onSelectChange={(id, chk) => setCoachSelected((p) => chk ? [...p, id] : p.filter((x) => x !== id))} onSelectAll={(chk) => setCoachSelected(chk ? coaches.map((c) => c.user.id) : [])} onCreateCoach={() => { setCadastroType('TREINADOR'); setCadastroOpen(true); }} onCreateAthlete={() => setNewAthleteOpen(true)} onRefresh={fetchCoachesData} />
          )}
          {tab === 'athletes' && (
            <AthletesTable athletes={athletes} selectedIds={athleteSelected} onSelectChange={(id, chk) => setAthleteSelected((p) => chk ? [...p, id] : p.filter((x) => x !== id))} onSelectAll={(chk) => setAthleteSelected(chk ? athletes.map((a) => a.player.id) : [])} onCreateCoach={() => { setCadastroType('TREINADOR'); setCadastroOpen(true); }} onCreateAthlete={() => setNewAthleteOpen(true)} onRefresh={fetchAthletesData} />
          )}
          {tab === 'matches' && <ClubMatchesTable matches={matches} />}
          {tab === 'club' && <ClubInfo />}
          {tab === 'managers' && <ManagersSection />}
        </div>
        <CadastrarMembroModal open={cadastroOpen} onOpenChange={setCadastroOpen} initialType={cadastroType} fixedType={cadastroType} onSave={() => { fetchCoachesData(); fetchAthletesData(); }} />
        <NewAthleteModal isOpen={newAthleteOpen} onClose={() => setNewAthleteOpen(false)} onCreated={() => { setNewAthleteOpen(false); fetchAthletesData(); }} myClub />
      </div>
    </div>
  );
}
