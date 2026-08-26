import type { Match } from './dashboard.types';
import { fetchWithTimeout } from './dashboard.fetch';
import { TIMEOUTS } from '@/lib/constants';

type LoadCallbacks = { onUnauthorized: () => void; onLoadingComplete: () => void };

async function readMatches(response: Response): Promise<Match[]> { if (!response.ok) return []; const json = await response.json() as { data?: { matches?: Match[] }; matches?: Match[] }; return json.data?.matches ?? json.matches ?? []; }
export async function loadInitialDashboard(accessToken: string, callbacks: LoadCallbacks): Promise<{ matches: Match[]; suspended: Match[] }> { const headers = { authorization: `Bearer ${accessToken}` }; const [matchesResponse, suspendedResponse] = await Promise.all([fetchWithTimeout('/api/matches', { headers }, TIMEOUTS.MATCH_FETCH_TIMEOUT_MS), fetchWithTimeout('/api/matches/suspended-sessions', { headers }, TIMEOUTS.MATCH_FETCH_TIMEOUT_MS)]); if (matchesResponse.status === 401 || suspendedResponse.status === 401) { callbacks.onUnauthorized(); return { matches: [], suspended: [] }; } const [matches, suspended] = await Promise.all([readMatches(matchesResponse), readMatches(suspendedResponse)]); callbacks.onLoadingComplete(); return { matches, suspended }; }
export function dedupeMatches(matches: Match[], suspended: Match[]) { const suspendedIds = new Set(suspended.map((match) => match.id)); return matches.filter((match) => !suspendedIds.has(match.id)); }
