'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LocateMatchesView } from './LocateMatchesView';
import { filterMatches } from './locate-matches.helpers';

export interface Match {
  id: string;
  player1: { name: string };
  player2: { name: string };
  tournamentName?: string;
  round?: string;
  scheduledAt?: string;
  state: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
}

export default function LocateMatchesPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED'>('ALL');
  const [filterTournament, setFilterTournament] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/matches')
      .then(res => res.json())
      .then(data => {
        setMatches(data.matches || []);
        setLoading(false);
      })
      .catch(() => {
        setMatches([]);
        setLoading(false);
      });
  }, []);

  const filteredMatches = filterMatches(matches, searchTerm, filterStatus, filterTournament);

  return <LocateMatchesView filteredMatches={filteredMatches} loading={loading} searchTerm={searchTerm} filterStatus={filterStatus} filterTournament={filterTournament} onSearch={setSearchTerm} onStatus={setFilterStatus} onTournament={setFilterTournament} onBack={() => router.back()} onOpen={(match) => { if (match.state === 'SCHEDULED') router.push(`/match/${match.id}/annotate` as any); else if (match.state === 'IN_PROGRESS') router.push(`/match/${match.id}` as any); else if (match.state === 'FINISHED') router.push(`/match/${match.id}/report`); }} />;
}
