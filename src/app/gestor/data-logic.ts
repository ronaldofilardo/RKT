/**
 * Lógica de busca de dados para o Painel do Gestor.
 */

import type { MeResponse, CoachItem, AthleteItem } from './types';

export async function fetchMe(): Promise<MeResponse | null> {
  const res = await fetch('/api/auth/me');
  if (!res.ok) return null;
  return res.json();
}

export async function fetchCoaches(): Promise<CoachItem[]> {
  const res = await fetch('/api/gestor/coaches', { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

export async function fetchAthletes(): Promise<AthleteItem[]> {
  const res = await fetch('/api/gestor/athletes');
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}
