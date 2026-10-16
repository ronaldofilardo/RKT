'use client';

import { NewAthleteModal } from '@/app/match/new/components/NewAthleteModal';
import { EditAthleteModal } from './EditAthleteModal';
import { AthleteSearchHeader } from './components/AthleteSearchHeader';
import { AthleteListTable } from './components/AthleteListTable';
import { DeleteAthleteModal } from './components/DeleteAthleteModal';
import { useAtletasPage } from './hooks/useAtletasPage';

export default function AtletasPage() {
  const {
    loading,
    athletes,
    error,
    editingAthlete,
    setEditingAthlete,
    showNewAthleteModal,
    setShowNewAthleteModal,
    athleteToDelete,
    setAthleteToDelete,
    deleting,
    saveAthleteChanges,
    confirmAthleteDeletion,
    loadAthletes,
  } = useAtletasPage();

  if (loading) {
    return (
      <div className="min-h-screen bg-telemetry-base flex items-center justify-center">
        <div className="text-telemetry-text-muted text-lg font-medium">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-telemetry-base">
      <AthleteSearchHeader
        athleteCount={athletes.length}
        onNewAthlete={() => setShowNewAthleteModal(true)}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-telemetry-alert/10 border border-telemetry-alert/30 text-telemetry-alert rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <AthleteListTable
          athletes={athletes}
          onEditAthlete={setEditingAthlete}
          onDeleteAthlete={setAthleteToDelete}
        />
      </main>

      <EditAthleteModal
        athlete={editingAthlete}
        isOpen={!!editingAthlete}
        onClose={() => setEditingAthlete(null)}
        onSave={saveAthleteChanges}
      />

      <NewAthleteModal
        isOpen={showNewAthleteModal}
        onClose={() => setShowNewAthleteModal(false)}
        onCreated={() => { setShowNewAthleteModal(false); loadAthletes(); }}
      />

      {athleteToDelete && (
        <DeleteAthleteModal
          athleteName={athleteToDelete.name}
          deleting={deleting}
          onCancel={() => setAthleteToDelete(null)}
          onConfirm={confirmAthleteDeletion}
        />
      )}
    </div>
  );
}
