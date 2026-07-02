'use client';

import { useState, useEffect } from 'react';
import { listSessions } from '@/services/annotationSessionService';
import type { AnnotationEndorsement } from '@/schemas/contracts';

interface AnnotationSessionPanelProps {
  sessionId: string | null;
  matchId: string;
  isActive: boolean;
  onStart: () => void;
  onPause: () => void;
  onEnd: () => void;
  annotatorCount: number;
}

export function AnnotationSessionPanel({ sessionId, matchId, isActive, onStart, onPause, onEnd, annotatorCount }: AnnotationSessionPanelProps) {
  const [endorsements, setEndorsements] = useState<AnnotationEndorsement[]>([]);

  useEffect(() => {
    if (!sessionId || isActive) {
      setEndorsements([]);
      return;
    }

    let cancelled = false;
    const poll = async () => {
      try {
        const sessions = await listSessions(matchId);
        if (cancelled) return;
        const current = sessions.find((s) => s.id === sessionId);
        if (current?.endorsements) {
          setEndorsements(current.endorsements);
        }
      } catch {
        // silent — keep stale data
      }
    };

    poll();
    const id = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [sessionId, matchId, isActive]);

  if (!sessionId) return null;

  const endorsedBy = endorsements.length > 0 ? endorsements[0].endorsedBy?.name : null;

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: isActive ? '#dcfce7' : '#fef3c7',
              color: isActive ? '#166534' : '#92400e',
              borderColor: isActive ? '#86efac' : '#fcd34d',
            }}>
            {isActive ? '🔴 AO VIVO' : '⏸️ PAUSADA'}
          </span>
          {!isActive && (
            endorsedBy ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
                ✅ Endossada por {endorsedBy}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-300">
                ⏳ Aguardando endosso
              </span>
            )
          )}
          <span className="text-xs text-gray-500">Sessão: {sessionId.slice(0, 8)}...</span>
        </div>
        <div className="flex items-center gap-2">
          {isActive ? (
            <button onClick={onPause} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
              Pausar
            </button>
          ) : (
            <button onClick={onStart} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors">
              Retomar
            </button>
          )}
          <button onClick={onEnd} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            Encerrar
          </button>
        </div>
      </div>
    </div>
  );
}