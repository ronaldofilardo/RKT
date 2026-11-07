export function getWinnerInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '–';
  if (parts.length >= 2) {
    return parts.map((p) => p[0].toUpperCase()).join('.') + '.';
  }
  return parts[0].slice(0, 3).toUpperCase();
}