export function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleString('pt-BR') : '–';
}
