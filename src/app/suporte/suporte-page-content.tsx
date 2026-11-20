'use client';
import { useState, useEffect } from 'react';
import type { SuporteTab, CtStatusFilter, SuporteData, TrainingCenter } from './types';
import { SuporteTabNav } from './suporte-tab-nav';
import { SuporteHeader } from './suporte-header';
import { ClubesSection } from './clubes-section';
import { GestoresSection } from './gestores-section';
import { AvulsosSection } from './avulsos-section';
import { FinanceiroSection } from './financeiro-section';
import { EditarClubeModal } from './editar-clube-modal';
import { patchUser, patchTrainingCenter } from './suporte-mutations';
import { DashboardChrome } from '@/app/dashboard/components/DashboardChrome';

interface SuportePageContentProps {
  data: SuporteData | null;
  loading: boolean;
  error: string | null;
  setError: (msg: string) => void;
  onRetry: () => void;
}

function SuportePageContent({ data, loading, error, setError, onRetry }: SuportePageContentProps) {
  const [tab, setTab] = useState<SuporteTab>('clubes');
  const [ctFilter, setCtFilter] = useState<CtStatusFilter>('ACTIVE');
  const [editClubOpen, setEditClubOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<TrainingCenter | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      // Aceita ?tab= (novo) e ?module= (legado). "externos" → "avulsos".
      const raw = params.get('tab') ?? params.get('module');
      const q = (raw === 'externos' ? 'avulsos' : raw) as SuporteTab;
      if (q && (['clubes', 'gestores', 'avulsos', 'financeiro'] as SuporteTab[]).includes(q)) setTab(q);
    }
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telemetry-blue"></div></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center p-4"><div className="bg-telemetry-error/10 border border-telemetry-error/20 text-telemetry-error p-6 rounded-xl max-w-md"><h2 className="font-bold mb-2">Erro</h2><p>{error}</p></div></div>;

  const { clubs, users, memberships } = data!;
  const gestoresCount = memberships.filter((m) => m.kind === 'GESTOR').length;
  const userIdsWithMemberships = new Set(memberships.map((m) => m.userId));
  const avulsosCount = users.filter((u) => !userIdsWithMemberships.has(u.id)).length;
  const externosCount = data?.externos?.totalAthletes ?? 0;

  const handleSuspend = async (ctId: string) => {
    try { await patchTrainingCenter(ctId, { status: 'SUSPENDED' }); onRetry(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao bloquear clube'); }
  };

  const handleReactivate = async (ctId: string) => {
    try { await patchTrainingCenter(ctId, { status: 'ACTIVE' }); onRetry(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao reativar clube'); }
  };

  const handleEditUser = async (userId: string, val: any) => {
    try { await patchUser(userId, val); onRetry(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao editar usuário'); }
  };

  const handleEditClub = async (ctId: string, val: any) => {
    try {
      await patchTrainingCenter(ctId, val);
      setEditClubOpen(false);
      setSelectedClub(null);
      onRetry();
    } catch (err) { setError(err instanceof Error ? err.message : 'Erro ao editar clube'); }
  };

  return (
    <div className="min-h-screen bg-telemetry-base">
      <DashboardChrome title="Painel do Suporte" showLogout={false} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SuporteHeader clubsCount={clubs.length} gestoresCount={gestoresCount} avulsosCount={avulsosCount} externosCount={externosCount} />
        <SuporteTabNav tab={tab} onTabChange={setTab} />
        <div className="space-y-6">
          {tab === 'clubes' && (
            <ClubesSection
              clubs={clubs}
              filter={ctFilter}
              onFilterChange={setCtFilter}
              onSuspend={handleSuspend}
              onReactivate={handleReactivate}
              onEditClub={(ct) => { setSelectedClub(ct); setEditClubOpen(true); }}
            />
          )}
          {tab === 'gestores' && (
            <GestoresSection memberships={memberships} users={users} clubs={clubs} onEdit={handleEditUser} onRefresh={onRetry} />
          )}
          {tab === 'avulsos' && (
            <AvulsosSection
              athletes={data?.externos?.athletes ?? []}
              clubs={data?.externos?.clubs ?? []}
              totalAthletes={data?.externos?.totalAthletes ?? 0}
              totalClubs={data?.externos?.totalClubs ?? 0}
              users={users}
              memberships={memberships}
            />
          )}
          {tab === 'financeiro' && <FinanceiroSection />}
        </div>
        {editClubOpen && selectedClub && (
          <EditarClubeModal
            open={editClubOpen}
            onOpenChange={setEditClubOpen}
            ct={selectedClub}
            onSave={(val) => handleEditClub(selectedClub!.id, val)}
            key={selectedClub.id}
          />
        )}
      </div>
    </div>
  );
}
export default SuportePageContent;
