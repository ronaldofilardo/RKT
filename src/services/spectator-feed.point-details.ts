import type { SpectatorPointDetails } from '@/core/spectate';

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.length > 0 ? v : undefined);
const obj = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

/**
 * Projeta as anotações do PointLog para a cascata pública do espectador.
 * Só campos da lista-branca: `note`, áudio, ids e demais anotações ficam de fora.
 * Retorna null quando o anotador não registrou detalhes.
 */
export function extractSpectatorPointDetails(
  annotations: Record<string, unknown> | null | undefined,
): SpectatorPointDetails | null {
  const rd = obj(annotations?.rallyDetails);
  const ff = obj(annotations?.firstFaultDetail);
  if (!rd && !ff) return null;

  const firstFault = ff
    ? { serveEffect: str(ff.serveEffect), direction: str(ff.direction) }
    : null;

  return {
    situacao: str(rd?.situacao),
    tipo: str(rd?.tipo),
    golpe: str(rd?.golpe),
    efeito: str(rd?.efeito),
    direcao: str(rd?.direcao),
    golpeEsp: str(rd?.golpe_esp),
    subtipo1: str(rd?.subtipo1),
    subtipo2: str(rd?.subtipo2),
    duracao: str(rd?.duracao),
    isSecondServe: annotations?.isSecondServe === true || annotations?.isFirstServe === false,
    firstFault,
  };
}
