'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Fuse from 'fuse.js';
import searchIndex from '@content/help/search-index.json';

/** URL do índice é sempre interna da Central (gerada pelo script help:index). */
interface HelpSearchHit {
  url: `/help/${string}`;
  title: string;
  perfil: string;
  text: string;
}

const articles = searchIndex.articles as unknown as HelpSearchHit[];

const fuse = new Fuse(articles, {
  keys: ['title', 'text'],
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 2,
});

const PERFIL_LABEL: Record<string, string> = {
  atleta: 'Atleta',
  treinador: 'Treinador',
  gestor: 'Gestor',
  responsavel: 'Responsável',
  espectador: 'Espectador',
  anotador: 'Anotador',
  referencia: 'Referência',
};

export function HelpSearch() {
  const [query, setQuery] = useState('');
  const term = query.trim();
  const hits = useMemo(
    () => (term.length >= 2 ? fuse.search(term).slice(0, 8).map((result) => result.item) : []),
    [term],
  );

  return (
    <div className="mb-8">
      <label htmlFor="help-search" className="sr-only">
        Buscar na Central de Ajuda
      </label>
      <input
        id="help-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar na ajuda (ex.: tiebreak, convite, privacidade)"
        className="w-full rounded-lg border border-telemetry-border/20 bg-telemetry-elevated px-4 py-2 text-sm text-telemetry-text-primary placeholder:text-telemetry-text-muted focus:border-telemetry-blue focus:outline-none"
      />
      {term.length >= 2 && (
        <ul aria-live="polite" className="mt-3 space-y-2">
          {hits.length === 0 && (
            <li className="text-sm text-telemetry-text-muted">
              {`Nenhum artigo encontrado para “${term}”.`}
            </li>
          )}
          {hits.map((hit) => (
            <li key={hit.url}>
              <Link
                href={hit.url}
                className="block rounded-lg border border-telemetry-border/20 p-3 hover:border-telemetry-blue/60 focus-visible:border-telemetry-blue"
              >
                <span className="font-semibold text-sm">{hit.title}</span>
                <span className="ml-2 text-xs text-telemetry-text-muted">
                  {PERFIL_LABEL[hit.perfil] ?? hit.perfil}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
