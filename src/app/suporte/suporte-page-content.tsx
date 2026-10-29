'use client';
import { useState, useEffect } from 'react';
import type { SuporteModule, CtStatusFilter, SuporteData, TrainingCenter } from './types';
import { ModuleNav } from './module-nav';
import { ClubesSection } from './clubes-section';
import { GestoresSection } from './gestores-section';
import { AvulsosSection } from './avulsos-section';
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
  const [module, setModule] = useState<SuporteModule>('clubes');
  const [ctFilter, setCtFilter] = useState<CtStatusFilter>('PENDING');
  const [editClubOpen, setEditClubOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<TrainingCenter | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('module') as SuporteModule;
      if (q && ['clubes', 'gestores', 'avulsos'].includes(q)) setModule(q);
    }
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telemetry-blue"></div></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center p-4"><div className="bg-telemetry-error/10 border border-telemetry-error/20 text-telemetry-error p-6 rounded-xl max-w-md"><h2 className="font-bold mb-2">Erro</h2><p>{error}</p></div></div>;

  const { clubs, users, memberships } = data!;

  const handleApprove = async (ctId: string) => {
    try { await patchTrainingCenter(ctId, { status: 'ACTIVE' }); onRetry(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao aprovar clube'); }
  };

  const handleSuspend = async (ctId: string) => {
    try { await patchTrainingCenter(ctId, { status: 'SUSPENDED' }); onRetry(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro ao suspender clube'); }
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
      <DashboardChrome title="Painel do Suporte" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div><h1 className="text-2xl font-bold text-telemetry-text-primary">Painel do Suporte</h1><p className="text-sm text-telemetry-text-muted">Gestão de clubes, gestores e contas da plataforma</p></div>
        </div>
        <ModuleNav module={module} onModuleChange={setModule} />
        {module === 'clubes' && <ClubesSection clubs={clubs} filter={ctFilter} onFilterChange={setCtFilter} onApprove={handleApprove} onSuspend={handleSuspend} onReactivate={handleApprove} onEditClub={(ct) => { setSelectedClub(ct); setEditClubOpen(true); }} />}
        {module === 'gestores' && <GestoresSection memberships={memberships} users={users} clubs={clubs} onEdit={handleEditUser} onRefresh={onRetry} />}
        {module === 'avulsos' && <AvulsosSection />}
        {editClubOpen && selectedClub && <EditarClubeModal open={editClubOpen} onOpenChange={setEditClubOpen} ct={selectedClub} onSave={(val) => handleEditClub(selectedClub!.id, val)} key={selectedClub.id} />}
      </div>
    </div>
  );
}
export default SuportePageContent;
