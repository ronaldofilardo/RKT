/**
 * Funções auxiliares puras de formatação e parsing para edição de dados da partida.
 */

export function toDateString(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toTimeString(iso: string | null | undefined): string {
  return iso
    ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '';
}

export function blankIfNull(value: string | null | undefined): string {
  return value || '';
}

export function numberInput(value: number | null | undefined): string {
  return value != null ? String(value) : '';
}

export function nullIfBlank(value: string): string | null {
  return value.trim() || null;
}

export function parseFloatOrNull(value: string): number | null {
  return value !== '' ? parseFloat(value) : null;
}
