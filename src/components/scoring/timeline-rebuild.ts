/**
 * Re-export para preservar compatibilidade retroativa de componentes e testes
 * que importavam diretamente de `@/components/scoring/timeline-rebuild`.
 * A lógica canônica reside em `@/core/scoring/timeline-rebuild`.
 */
export type { PointLogRow } from '@/core/scoring/timeline-rebuild';
export { rebuildTimelineFromPointLogs } from '@/core/scoring/timeline-rebuild';
