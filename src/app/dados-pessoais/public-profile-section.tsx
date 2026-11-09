'use client';

import { PublicNicknameField } from './public-nickname-field';

interface PublicProfileSectionProps {
  playerId: string | null;
  nickname: string;
  poolVisible: boolean;
  minor: boolean;
  loading: boolean;
  saving: boolean;
  message: string | null;
  error: string | null;
  saveNickname: (value: string) => void;
  toggleVisibility: (visible: boolean) => void;
}

export function PublicProfileSection({
  playerId,
  nickname,
  poolVisible,
  minor,
  loading,
  saving,
  message,
  error,
  saveNickname,
  toggleVisibility,
}: PublicProfileSectionProps) {
  if (loading) {
    return <p className="text-telemetry-text-muted text-sm">Carregando perfil público...</p>;
  }

  if (!playerId) {
    return (
      <section className="rounded-xl border border-white/10 bg-telemetry-card p-4 space-y-2">
        <h2 className="text-base font-semibold text-telemetry-text-primary">Perfil Público</h2>
        <p className="text-sm text-telemetry-text-muted">
          Esta conta não está vinculada a um atleta. O apelido público pertence ao atleta.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-white/10 bg-telemetry-card p-4 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-telemetry-text-primary">Perfil Público</h2>
        <p className="text-xs text-telemetry-text-muted">
          O apelido é único no sistema e só aparece no pool quando você autoriza.
        </p>
      </div>

      <PublicNicknameField nickname={nickname} saving={saving} onSave={saveNickname} />

      <label className="flex items-start gap-3 text-sm text-telemetry-text-primary">
        <input
          type="checkbox"
          checked={poolVisible}
          disabled={saving}
          onChange={(event) => toggleVisibility(event.target.checked)}
          className="mt-1 accent-telemetry-volt"
        />
        <span>
          Visível no pool de atletas
          <span className="block text-xs text-telemetry-text-muted">
            Outros usuários encontram seu apelido na busca de atletas.
          </span>
        </span>
      </label>

      {minor && (
        <p className="rounded-lg border border-amber-400/40 bg-telemetry-elevated p-3 text-xs text-telemetry-text-primary">
          Atleta menor de idade: a liberação no pool exige consentimento ativo do responsável.
        </p>
      )}

      {message && <p role="status" className="text-sm text-emerald-800 dark:text-telemetry-volt">{message}</p>}
      {error && <p role="alert" className="text-sm text-telemetry-alert">{error}</p>}
    </section>
  );
}
