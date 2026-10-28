/**
 * Lógica de busca de dados para o Painel do Suporte.
 */

import type { TrainingCenter, UserItem, MembershipItem } from './types';

export async function fetchClubs(): Promise<TrainingCenter[]> {
  const res = await fetch('/api/training-centers');
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

export async function fetchUsers(): Promise<UserItem[]> {
  const res = await fetch('/api/users');
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

export async function fetchMemberships(): Promise<MembershipItem[]> {
  const res = await fetch('/api/memberships');
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}
