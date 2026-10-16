'use client';

import { MatchNewHeader } from './components';
import { useNewMatchController } from './useNewMatchController';
import { MatchNewErrorBanner } from './MatchNewErrorBanner';
import { MatchNewFormSections } from './MatchNewFormSections';
import { MatchNewModals } from './MatchNewModals';

export default function NewMatchPage() {
  const c = useNewMatchController();

  return (
    <div className="min-h-screen bg-telemetry-base text-telemetry-text-primary safe-top safe-bottom">
      <MatchNewHeader />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <MatchNewErrorBanner error={c.error} missingFields={c.missingFields} />

        <MatchNewFormSections c={c} />
      </main>

      <MatchNewModals
        router={c.router}
        showNewAthleteModal={c.showNewAthleteModal}
        setShowNewAthleteModal={c.setShowNewAthleteModal}
        handleAthleteCreated={c.handleAthleteCreated}
        showServerModal={c.showServerModal}
        setShowServerModal={c.setShowServerModal}
        selectedP1={c.selectedP1}
        selectedP2={c.selectedP2}
        startingMatch={c.startingMatch}
        handleSelectServer={c.handleSelectServer}
        showDuplicateModal={c.showDuplicateModal}
        setShowDuplicateModal={c.setShowDuplicateModal}
        duplicateInfo={c.duplicateInfo}
        handleForceCreate={c.handleForceCreate}
      />
    </div>
  );
}
