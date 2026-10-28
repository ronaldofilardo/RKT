export const PROFILE_OPTIONS = [
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'SUPORTE', label: 'Suporte' },
  { value: 'GESTOR', label: 'Responsável/gestor de clube' },
  { value: 'TREINADOR', label: 'Treinador' },
  { value: 'ATLETA_CLUBE', label: 'Atleta vinculado a clube' },
  { value: 'ATLETA_AVULSO', label: 'Atleta avulso' },
  { value: 'ANNOTATOR', label: 'Anotador' },
];

export function getProfileBadgeClass(profile?: string, role?: string): string {
  const p = profile || role || '';
  if (p === 'ADMIN') return 'bg-purple-100 text-purple-800';
  if (p === 'Suporte' || p === 'SUPORTE') return 'bg-indigo-100 text-indigo-800';
  if (p.includes('gestor') || p === 'GESTOR') return 'bg-amber-100 text-amber-800';
  if (p.includes('Treinador') || p === 'TREINADOR') return 'bg-teal-100 text-teal-800';
  if (p.includes('Atleta') || p === 'ATLETA') return 'bg-emerald-100 text-emerald-800';
  return 'bg-sky-100 text-sky-800';
}

export function getInitialRole(profile?: string, role?: string): string {
  const match = PROFILE_OPTIONS.find((opt) => opt.label === profile || opt.value === profile || opt.value === role);
  return match?.value || (role === 'ADMIN' ? 'ADMIN' : 'ANNOTATOR');
}
