import type { MutableRefObject } from 'react';
import type { ScoringEngine } from '@/core/scoring/engine';
import type { MatchData } from './useScoringHandlers.types';
import { createServerHelpersService } from './useScoringHandlers.server-helpers.service';

interface ServerHelpersOptions {
  engineRef: MutableRefObject<ScoringEngine | null>;
  match: MatchData | null;
}

/**
 * Adaptador de compatibilidade. A implementação canônica vive no helper
 * `.service`; este export permanece apenas para consumidores legados.
 */
export function createServerHelpers(options: ServerHelpersOptions) {
  return createServerHelpersService(options);
}
