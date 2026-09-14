/**
 * CHARACTERIZATION TEST — rls-context.ts
 *
 * Propósito: documentar o comportamento OBSERVADO do módulo RLS
 * (Row-Level Security) context.
 * Data: 2026-07-20
 * Owner: @qa
 * Atualizado em: 2026-09-13 — Role enum: ADMIN | ANNOTATOR
 *
 * Estes testes capturam o que o código FAZ (não o que deveria fazer).
 * São "characterization tests" — mudam apenas quando o comportamento
 * muda deliberadamente.
 */

import { describe, it, expect, afterEach, jest } from '@jest/globals';
import { __setRLSUserForTesting, getRLSUser } from '@/lib/rls-context';

describe('rls-context — Characterization', () => {
  afterEach(() => {
    __setRLSUserForTesting(null);
  });

  describe('getRLSUser behavior', () => {
    it('returns null when no user is set', () => {
      const user = getRLSUser();
      expect(user).toBeNull();
    });
  });

  describe('__setRLSUserForTesting', () => {
    it('sets and retrieves user successfully with ADMIN role', () => {
      __setRLSUserForTesting({ id: 'user-1', role: 'ADMIN' });
      const user = getRLSUser();
      expect(user).toEqual({ id: 'user-1', role: 'ADMIN' });
    });

    it('sets and retrieves user successfully with ANNOTATOR role', () => {
      __setRLSUserForTesting({ id: 'user-2', role: 'ANNOTATOR' });
      const user = getRLSUser();
      expect(user).toEqual({ id: 'user-2', role: 'ANNOTATOR' });
    });

    it('clears user when set to null', () => {
      __setRLSUserForTesting({ id: 'user-1', role: 'ADMIN' });
      __setRLSUserForTesting(null);
      const user = getRLSUser();
      expect(user).toBeNull();
    });
  });
});
