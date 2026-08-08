/**
 * Registry for `MatchFormatStrategy` implementations.
 *
 * Lookup is O(1) via `Map.get`; unknown formats throw `UNKNOWN_FORMAT` so
 * callers can no longer silently mask missing formats via `as any` (closes
 * the 6-cast `format as any` issue documented in the senior audit).
 *
 * @see docs/adr/ADR-0003-match-format-strategy.md
 */

import type { TennisFormat } from '../types';
import type { MatchFormatStrategy } from './match-format-strategy';

export class MatchFormatRegistry {
  private readonly strategies = new Map<TennisFormat, MatchFormatStrategy>();

  register(strategy: MatchFormatStrategy): void {
    if (this.strategies.has(strategy.format)) {
      throw new Error(`DUPLICATE_FORMAT_STRATEGY: ${strategy.format}`);
    }
    this.strategies.set(strategy.format, strategy);
  }

  resolve(format: TennisFormat): MatchFormatStrategy {
    const s = this.strategies.get(format);
    if (!s) {
      throw new Error(`UNKNOWN_FORMAT: ${String(format)}`);
    }
    return s;
  }

  has(format: TennisFormat): boolean {
    return this.strategies.has(format);
  }
}

export const matchFormatRegistry = new MatchFormatRegistry();
