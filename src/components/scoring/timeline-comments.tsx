'use client';

import { AudioNotePlayer } from './AudioNotePlayer';

export interface TimelineComment {
  id: string;
  content: string;
  category?: string | null;
  authorName: string;
  createdAt: string;
  hasAudioNote?: boolean;
  audioNoteDuration?: number | null;
}

function formatCommentDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export function TimelineComments({ comments, matchId }: { comments: TimelineComment[]; matchId: string }) {
  if (comments.length === 0) return null;
  const sorted = [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="mt-3 bg-telemetry-alert/10 border border-telemetry-alert/20 rounded-lg px-3 py-2">
      <p className="font-semibold text-telemetry-alert text-[11px] mb-2">💬 Comentários</p>
      <div className="space-y-2">
        {sorted.map((c) => (
          <div key={c.id} className="bg-telemetry-card rounded-lg px-3 py-2 border border-white/10">
            <p className="text-[11px] text-telemetry-text-primary">{c.content}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] text-telemetry-text-muted">{c.authorName}</span>
              <span className="text-[9px] text-telemetry-text-muted/50">·</span>
              <span className="text-[9px] text-telemetry-text-muted">{formatCommentDate(c.createdAt)}</span>
              {c.category && (
                <>
                  <span className="text-[9px] text-telemetry-text-muted/50">·</span>
                  <span className="text-[9px] text-telemetry-alert font-medium">{c.category}</span>
                </>
              )}
              {c.hasAudioNote && (
                <div className="ml-1">
                  <AudioNotePlayer
                    matchId={matchId}
                    commentId={c.id}
                    durationMs={c.audioNoteDuration || undefined}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
