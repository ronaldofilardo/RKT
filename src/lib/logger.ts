/**
 * Logging service with environment-based filtering
 *
 * Usage:
 * - logger.log() - Development only
 * - logger.info() - Always
 * - logger.warn() - Always
 * - logger.error() - Always
 * - logger.debug() - Development only
 *
 * Namespaced loggers:
 * - logger.point - Point request/response lifecycle
 * - logger.match - Match creation/state transitions
 * - logger.session - Annotation session lifecycle
 * - logger.sync - Offline sync operations
 * - logger.persist - State persistence (undo/redo)
 */

import { devLog, devDebug } from "./logger-dev.helpers";
import { pointLogger } from "./logger-point";
import { matchLogger, sessionLogger, syncLogger, persistLogger } from "./logger-domain";

export const logger = {
  log: (...args: unknown[]) => devLog(...args),

  info: (...args: unknown[]) => {
    console.info(...args);
  },

  warn: (...args: unknown[]) => {
    console.warn(...args);
  },

  error: (...args: unknown[]) => {
    console.error(...args);
  },

  debug: (...args: unknown[]) => devDebug(...args),

  point: pointLogger,
  match: matchLogger,
  session: sessionLogger,
  sync: syncLogger,
  persist: persistLogger,
};
