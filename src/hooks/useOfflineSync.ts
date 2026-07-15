'use client';

import { useEffect, useState, useCallback } from 'react';
import { openDB, IDBPDatabase } from 'idb';
import type { QueuedAction } from '@/schemas/contracts';

const DB_NAME = 'racket-offline-db';
const STORE_NAME = 'optimistic-queue';
const DB_VERSION = 1;

async function getDb(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status');
        store.createIndex('timestamp', 'timestamp');
      }
    },
  });
}

export function useOfflineSync() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const enqueue = useCallback(async (action: Omit<QueuedAction, 'id' | 'status' | 'retries'>) => {
    const db = await getDb();
    const queuedAction: QueuedAction = {
      ...action,
      id: crypto.randomUUID(),
      status: 'PENDING',
      retries: 0,
    };
    await db.add(STORE_NAME, queuedAction);
    return queuedAction;
  }, []);

  const flush = useCallback(async (accessToken: string) => {
    const db = await getDb();
    const pending = await db.getAllFromIndex(STORE_NAME, 'status', 'PENDING');
    pending.sort((a, b) => a.timestamp - b.timestamp);

    // PROTEÇÃO #5: Recálculo de Sequência no Flush
    // Buscar sequência atual do banco para cada partida antes de enviar
    const matchSequences = new Map<string, number>();

    for (let i = 0; i < pending.length; i++) {
      const action = pending[i];
      
      try {
        // Obter sequência atual da partida se ainda não buscamos
        if (!matchSequences.has(action.matchId)) {
          try {
            const matchRes = await fetch(`/api/matches/${action.matchId}`, {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
            });
            
            if (matchRes.ok) {
              const matchData = await matchRes.json();
              // version é o número de pontos já persistidos
              matchSequences.set(action.matchId, matchData.version || 0);
            } else {
              // Se não conseguiu buscar, usa 0 como fallback
              matchSequences.set(action.matchId, 0);
            }
          } catch (err) {
            console.error('[flush] Failed to fetch match sequence:', err);
            matchSequences.set(action.matchId, 0);
          }
        }
        
        const currentSequence = matchSequences.get(action.matchId) || 0;
        const nextSequence = currentSequence + 1;
        
        // Atualizar payload com sequência correta
        const payloadWithSequence = {
          ...action.payload,
          sequenceNumber: nextSequence,
        };
        
        await db.put(STORE_NAME, { ...action, status: 'SYNCING' });

        const response = await fetch(`/api/matches/${action.matchId}/point`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payloadWithSequence),
        });

        if (response.ok) {
          await db.delete(STORE_NAME, action.id);
          window.dispatchEvent(new CustomEvent('offline-sync-complete'));
          // Atualizar sequência para o próximo ponto desta partida
          matchSequences.set(action.matchId, nextSequence);
        } else {
          const errorData = await response.json().catch(() => ({}));
          
          // Se for SEQUENCE_CONFLICT, atualizar sequência e retry
          if (errorData.error === 'SEQUENCE_CONFLICT' && errorData.expectedSequence) {
            matchSequences.set(action.matchId, errorData.expectedSequence - 1);
            // Retry imediato com sequência corrigida
            const correctedPayload = {
              ...action.payload,
              sequenceNumber: errorData.expectedSequence,
            };
            
            const retryResponse = await fetch(`/api/matches/${action.matchId}/point`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(correctedPayload),
            });
            
            if (retryResponse.ok) {
              await db.delete(STORE_NAME, action.id);
              window.dispatchEvent(new CustomEvent('offline-sync-complete'));
              matchSequences.set(action.matchId, errorData.expectedSequence);
              continue;
            }
          }
          
          await db.put(STORE_NAME, {
            ...action,
            status: action.retries >= 3 ? 'FAILED' : 'PENDING',
            retries: action.retries + 1,
          });
        }
      } catch {
        await db.put(STORE_NAME, {
          ...action,
          status: 'PENDING',
          retries: action.retries + 1,
        });
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      const token = sessionStorage.getItem('access_token');
      if (token) flush(token);
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flush]);

  return { enqueue, flush, isOnline: online };
}
