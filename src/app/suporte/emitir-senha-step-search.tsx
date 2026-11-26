'use client';

import type { UserSearchResult } from './types';

interface EmitirSenhaSearchStepProps {
  query: string;
  setQuery: (value: string) => void;
  results: UserSearchResult[];
  loading: boolean;
  inputRef: { current: HTMLInputElement | null };
  onSearch: () => void;
  onSelect: (user: UserSearchResult) => void;
}

/** Passo 1 — busca por CPF ou e-mail. */
export function EmitirSenhaSearchStep({
  query,
  setQuery,
  results,
  loading,
  inputRef,
  onSearch,
  onSelect,
}: EmitirSenhaSearchStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-telemetry-text-muted">
        Informe o CPF (somente números) ou o e-mail do usuário para localizar a conta.
      </p>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          placeholder="CPF ou e-mail"
          className="flex-1 bg-telemetry-base border border-telemetry-border/30 rounded-lg px-3 py-2 text-sm text-telemetry-text-primary placeholder:text-telemetry-text-muted focus:outline-none focus:border-telemetry-blue"
        />
        <button
          onClick={onSearch}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-telemetry-blue text-white text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-telemetry-blue/80 transition-colors"
        >
          {loading ? '...' : 'Buscar'}
        </button>
      </div>

      {results.length > 0 && (
        <ul className="divide-y divide-telemetry-border/20 border border-telemetry-border/20 rounded-xl overflow-hidden">
          {results.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => onSelect(u)}
                className="w-full text-left px-4 py-3 hover:bg-telemetry-elevated/40 transition-colors"
              >
                <p className="text-sm font-medium text-telemetry-text-primary">{u.name}</p>
                <p className="text-xs text-telemetry-text-muted">{u.email} · {u.role}</p>
                {!u.isActive && (
                  <span className="text-[10px] text-telemetry-error font-semibold uppercase tracking-wide">Conta inativa</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
