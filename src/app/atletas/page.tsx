'use client';

import { LinkCopyModal } from '@/app/gestor/link-copy-modal';
import { EditAthleteModal } from './EditAthleteModal';
import { AthleteSearchHeader } from './components/AthleteSearchHeader';
import { AthleteListTable } from './components/AthleteListTable';
import { DeleteAthleteModal } from '@/components/athlete/delete-athlete-modal';
import { useAtletasPage } from './hooks/useAtletasPage';
import { useAtletasContext } from './hooks/use-atletas-context';
import { useAthleteLink } from './hooks/use-athlete-link';
import { playersClient } from '@/services/playersClient';

export default function AtletasPage() {
  const {
    loading, athletes, error, editingAthlete, setEditingAthlete,
    showNewAthleteModal, setShowNewAthleteModal, athleteToDelete, setAthleteToDelete,
    deleting, currentUserId, userRole, saveAthleteChanges, confirmAthleteDeletion, loadAthletes,
  } = useAtletasPage();
  const ctx = useAtletasContext();
  const { linkData, loadingLinkId, linkError, generateLink, closeLinkModal } = useAthleteLink();

  const isTreinador = userRole === 'TREINADOR';
  const isClubCoach = isTreinador && !ctx.isParticular;
  const headerTitle = isTreinador
    ? ctx.isParticular ? 'Meus Atletas (Particulares)' : ctx.ctName ? `Atletas · ${ctx.ctName}` : 'Atletas'
    : undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-telemetry-base flex items-center justify-center">
        <div className="text-telemetry-text-muted text-lg font-medium">Carregando...</div>
      </div>
    );
  }

  const activeError = error || linkError;

  return (
    <div className="min-h-screen bg-telemetry-base">
      <AthleteSearchHeader
        title={headerTitle} athleteCount={athletes.length}
        onNewAthlete={() => setShowNewAthleteModal(true)}
        activeContextId={ctx.activeContextId} availableContexts={ctx.availableContexts}
        onContextSwitched={() => { ctx.loadContext(); loadAthletes(); }}
      />

      <main className="max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {activeError && (
          <div className="mb-4 p-4 bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {activeError}
          </div>
        )}

        <AthleteListTable
          athletes={athletes} currentUserId={currentUserId} userRole={userRole} isClubCoach={isClubCoach}
          onEditAthlete={setEditingAthlete} onDeleteAthlete={setAthleteToDelete}
          onGenerateLink={generateLink} loadingLinkId={loadingLinkId}
        />
      </main>

      <EditAthleteModal athlete={editingAthlete} isOpen={!!editingAthlete} readOnly={isClubCoach} onClose={() => setEditingAthlete(null)} onSave={saveAthleteChanges} />
      <EditAthleteModal
        isOpen={showNewAthleteModal}
        athlete={null}
        showCpf={true}
        onClose={() => setShowNewAthleteModal(false)}
        onSave={async (payload) => {
          const token = typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;
          await playersClient.create({
            ...payload,
            myClub: true,
            ctId: ctx.isParticular ? null : ctx.activeContextId,
          }, token);
          setShowNewAthleteModal(false);
          await loadAthletes();
        }}
      />
      {athleteToDelete && (
        <DeleteAthleteModal
          athleteName={athleteToDelete.name}
          deleting={deleting}
          onCancel={() => setAthleteToDelete(null)}
          onConfirm={confirmAthleteDeletion}
          note="Caso o atleta possua partidas em andamento ou finalizadas, a exclusão será bloqueada para não afetar essas partidas."
        />
      )}
      {linkData && <LinkCopyModal open={Boolean(linkData)} onOpenChange={(open) => { if (!open) closeLinkModal(); }} title="Link de Primeiro Acesso" recipientName={linkData.recipientName} token={linkData.token} expiresAt={linkData.expiresAt} />}
    </div>
  );
}
