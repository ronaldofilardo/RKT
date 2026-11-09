'use client';

import { useEffect, useState } from 'react';

interface PublicNicknameFieldProps {
  nickname: string;
  saving: boolean;
  onSave: (value: string) => void;
}

export function PublicNicknameField({ nickname, saving, onSave }: PublicNicknameFieldProps) {
  const [draft, setDraft] = useState(nickname);

  useEffect(() => { setDraft(nickname); }, [nickname]);

  return (
    <div>
      <label htmlFor="profile-nickname" className="block text-sm font-medium text-telemetry-text-primary mb-1">
        Apelido (nickname)
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="profile-nickname"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={30}
          disabled={saving}
          placeholder="Ex: joao.silva"
          className="flex-1 px-3 py-2 border border-white/10 rounded-lg bg-telemetry-elevated text-telemetry-text-primary placeholder-telemetry-text-muted/50"
        />
        <button
          type="button"
          onClick={() => onSave(draft)}
          disabled={saving}
          className="rounded-lg bg-telemetry-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Salvar apelido
        </button>
      </div>
    </div>
  );
}
