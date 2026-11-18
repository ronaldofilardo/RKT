'use client';

import { useEffect, useState } from 'react';
import type { EntitySearchItem } from '@/app/api/entities/search/entities-search.logic';

type SearchKind = 'CT' | 'COACH';

const DEBOUNCE_MS = 350;
const MIN_QUERY = 2;

/** Busca com debounce no pool de CTs/treinadores (Etapa 3 do responsável). */
export function useStaffSearch(kind: SearchKind, query: string) {
  const [items, setItems] = useState<EntitySearchItem[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY) {
      setItems([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const url = `/api/entities/search?q=${encodeURIComponent(trimmed)}&type=${kind}`;
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();
        if (res.ok) setItems(data.data?.items ?? []);
      } catch {
        /* busca cancelada/sem rede: mantém a lista anterior */
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [kind, query]);

  return { items, searching };
}
