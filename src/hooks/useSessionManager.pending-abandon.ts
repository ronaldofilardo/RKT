"use client";
import { logger } from "@/lib/logger";

// Bug fix (2026-09-08): abandonCurrentSession fazia POST .../abandon dentro de um
// try/catch que só logava o erro em caso de falha (ex.: rede instável, sync pendente),
// sem retry e sem fila offline — diferente dos pontos de jogo, que já têm fila/sync.
// O usuário era levado para /dashboard acreditando que a anotação foi suspensa, mas a
// sessão nunca era marcada como ABANDONED no banco (ficava "pendurada" como ativa).
// Esse módulo guarda localmente as tentativas de abandono que falharam, para que sejam
// reenviadas na próxima oportunidade (retomada do app / dashboard ganhando foco).

const STORAGE_KEY = "pending_abandons";

export interface PendingAbandon {
  matchId: string;
  sessionId: string;
  matchStateSnapshot: string;
  token: string | null;
  createdAt: number;
}

function readQueue(): PendingAbandon[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: PendingAbandon[]): void {
  try {
    if (queue.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    }
  } catch (e) {
    logger.warn("[pending-abandon] falha ao gravar fila local:", e);
  }
}

export function enqueuePendingAbandon(entry: PendingAbandon): void {
  const queue = readQueue().filter(
    (e) => !(e.matchId === entry.matchId && e.sessionId === entry.sessionId)
  );
  queue.push(entry);
  writeQueue(queue);
}

/**
 * Tenta reenviar todos os abandonos pendentes salvos localmente.
 * Deve ser chamado em pontos de "retomada de conectividade/foco" (ex.: dashboard
 * ao montar, ou quando a aba volta a ficar visível).
 */
export async function flushPendingAbandons(): Promise<void> {
  const queue = readQueue();
  if (queue.length === 0) return;

  const remaining: PendingAbandon[] = [];

  for (const entry of queue) {
    try {
      const response = await fetch(
        `/api/matches/${entry.matchId}/sessions/${entry.sessionId}/abandon`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(entry.token ? { Authorization: `Bearer ${entry.token}` } : {}),
          },
          body: JSON.stringify({ matchStateSnapshot: entry.matchStateSnapshot }),
        }
      );
      if (!response.ok) {
        remaining.push(entry);
      } else {
        logger.info(
          `[flushPendingAbandons] sessão ${entry.sessionId} da partida ${entry.matchId} finalmente marcada como abandonada`
        );
      }
    } catch (e) {
      logger.warn("[flushPendingAbandons] ainda sem conectividade, mantendo na fila:", e);
      remaining.push(entry);
    }
  }

  writeQueue(remaining);
}
