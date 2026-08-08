/**
 * Barrel that registers all format strategies by side-effect.
 *
 * Importing this module guarantees all 7 strategies are in `matchFormatRegistry`.
 * Importing from this barrel also re-exports the registry and the strategy
 * interface for consumers.
 *
 * @see docs/adr/ADR-0003-match-format-strategy.md
 */

import { matchFormatRegistry } from './match-format-registry';
import {
  bestOf3Strategy,
  bestOf3NoAdStrategy,
  bestOf3MatchTbStrategy,
  bestOf5Strategy,
  matchTb10Strategy,
  proSet8Strategy,
  shortSet2v2NoAdStrategy,
} from './strategies';

matchFormatRegistry.register(bestOf3Strategy);
matchFormatRegistry.register(bestOf3NoAdStrategy);
matchFormatRegistry.register(bestOf3MatchTbStrategy);
matchFormatRegistry.register(bestOf5Strategy);
matchFormatRegistry.register(matchTb10Strategy);
matchFormatRegistry.register(proSet8Strategy);
matchFormatRegistry.register(shortSet2v2NoAdStrategy);

export { matchFormatRegistry } from './match-format-registry';
export type { MatchFormatStrategy } from './match-format-strategy';
export { MatchFormatRegistry } from './match-format-registry';
