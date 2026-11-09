'use client';

import { DashboardChrome } from '@/app/dashboard/components/DashboardChrome';
import { useProfilePublic } from './useProfilePublic';
import { PublicProfileSection } from './public-profile-section';

export default function DadosPessoaisPage() {
  const profile = useProfilePublic();

  return (
    <div className="min-h-screen bg-telemetry-base text-telemetry-text-primary">
      <DashboardChrome title="Dados Pessoais" />

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-2xl font-bold">Dados Pessoais</h1>
        <PublicProfileSection
          playerId={profile.playerId}
          nickname={profile.nickname}
          poolVisible={profile.poolVisible}
          minor={profile.minor}
          loading={profile.loading}
          saving={profile.saving}
          message={profile.message}
          error={profile.error}
          saveNickname={profile.saveNickname}
          toggleVisibility={profile.toggleVisibility}
        />
      </main>
    </div>
  );
}
