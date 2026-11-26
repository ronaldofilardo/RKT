'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAreaPath } from '@/hooks/use-area-path';
import type { MeResponse, ClubMatchItem, GestorTab, MemberType } from './types';
import { TabNav } from './tab-nav';
import { CoachesTable } from './coaches-table';
import { AthletesTable } from './athletes-table';
import { AffiliatesTable } from './affiliates-table';
import { ClubMatchesTable } from './club-matches-table';
import { SolicitacoesTable } from './solicitacoes-table';
import { ClubInfo } from './club-info';
import { DashboardHeader } from './dashboard-header';
import { DashboardChrome } from '@/app/dashboard/components/DashboardChrome';
import { BillingOverlayOrchestrator } from '@/components/billing/billing-overlay-orchestrator';
import { requestAnnotateMatch } from './gestor-match-actions.logic';
import { useGestorDashboardData } from './use-gestor-dashboard-data';
import { GestorDashboardModals } from './gestor-dashboard-modals';

interface GestorDashboardProps {
  me: MeResponse;
  tab: GestorTab;
  setTab: (tab: GestorTab) => void;
}

export function GestorDashboard({ me, tab, setTab }: GestorDashboardProps) {
  const router = useRouter();
  const toAreaPath = useAreaPath();
  const {
    coaches, athletes, matches, externalMatches, affiliates, requests, loading,
    fetchCoachesData, fetchAthletesData, fetchMatchesData, fetchRequestsData,
  } = useGestorDashboardData();

  const [coachSelected, setCoachSelected] = useState<string[]>([]);
  const [athleteSelected, setAthleteSelected] = useState<string[]>([]);
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [cadastroType, setCadastroType] = useState<MemberType>('TREINADOR');
  const [newAthleteOpen, setNewAthleteOpen] = useState(false);
  const [matchToAssign, setMatchToAssign] = useState<ClubMatchItem | null>(null);
  const [matchToEdit, setMatchToEdit] = useState<ClubMatchItem | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<ClubMatchItem | null>(null);

  const gestorCtId = me.memberships.find((m) => m.kind === 'GESTOR' && m.status === 'ACTIVE')?.ctId
    ?? me.memberships.find((m) => m.kind === 'GESTOR')?.ctId ?? null;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telemetry-blue" /></div>;

  return (
    <div className="min-h-screen bg-telemetry-base">
      <DashboardChrome title="Painel do Gestor" showMenu={false} />
      <BillingOverlayOrchestrator billing={me.billing ?? null} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardHeader me={me} />
        <TabNav tab={tab} onTabChange={setTab} coachesCount={coaches.length} athletesCount={athletes.length} affiliatesCount={affiliates.length} matchesCount={matches.length + externalMatches.length} solicitacoesCount={requests.length} />
        <div className="space-y-6">
          {tab === 'coaches' && <CoachesTable coaches={coaches} selectedIds={coachSelected} onSelectChange={(id, chk) => setCoachSelected((p) => chk ? [...p, id] : p.filter((x) => x !== id))} onSelectAll={(chk) => setCoachSelected(chk ? coaches.map((c) => c.user.id) : [])} onCreateCoach={() => { setCadastroType('TREINADOR'); setCadastroOpen(true); }} onRefresh={fetchCoachesData} />}
          {tab === 'athletes' && <AthletesTable athletes={athletes} selectedIds={athleteSelected} onSelectChange={(id, chk) => setAthleteSelected((p) => chk ? [...p, id] : p.filter((x) => x !== id))} onSelectAll={(chk) => setAthleteSelected(chk ? athletes.map((a) => a.player.id) : [])} onCreateAthlete={() => setNewAthleteOpen(true)} onRefresh={fetchAthletesData} />}
          {tab === 'solicitacoes' && <SolicitacoesTable requests={requests} onRefresh={() => { fetchRequestsData(); fetchAthletesData(); }} />}
          {tab === 'affiliates' && <AffiliatesTable athletes={affiliates} />}
          {tab === 'matches' && (
            <ClubMatchesTable
              matches={matches} externalMatches={externalMatches} currentUserId={me.user.id}
              onCreateMatch={() => router.push(toAreaPath('/match/new?from=gestor') as any)} onAssignCoach={setMatchToAssign}
              onDeleteMatch={setMatchToDelete}
              onAnnotateMatch={(m) => requestAnnotateMatch(m, (path) => router.push(toAreaPath(path) as any))}
              onEditMatchInfo={setMatchToEdit}
            />
          )}
          {tab === 'club' && <ClubInfo />}
        </div>
        <GestorDashboardModals
          cadastroOpen={cadastroOpen} setCadastroOpen={setCadastroOpen} cadastroType={cadastroType}
          newAthleteOpen={newAthleteOpen} setNewAthleteOpen={setNewAthleteOpen} gestorCtId={gestorCtId}
          matchToAssign={matchToAssign} setMatchToAssign={setMatchToAssign}
          matchToEdit={matchToEdit} setMatchToEdit={setMatchToEdit}
          matchToDelete={matchToDelete} setMatchToDelete={setMatchToDelete}
          coaches={coaches} fetchCoachesData={fetchCoachesData} fetchAthletesData={fetchAthletesData} fetchMatchesData={fetchMatchesData}
        />
      </div>
    </div>
  );
}
