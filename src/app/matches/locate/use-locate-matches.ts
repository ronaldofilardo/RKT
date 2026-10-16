import { useState, useEffect } from 'react';
import { matchesClient } from '@/services/matchesClient';
import { filterMatches, type Match, type LocateFilterStatus } from './locate-matches.helpers';

export function useLocateMatches() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<LocateFilterStatus>('ALL');
  const [filterTournament, setFilterTournament] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    matchesClient.listMatches(controller.signal)
      .then((data) => {
        const payload = data as { data?: { matches?: Match[] }; matches?: Match[] };
        setMatches(payload?.data?.matches ?? payload?.matches ?? []);
        setLoading(false);
      })
      .catch(() => {
        setMatches([]);
        setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const filteredMatches = filterMatches(matches, searchTerm, filterStatus, filterTournament);

  return {
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    filterTournament, setFilterTournament,
    filteredMatches, loading,
  };
}
