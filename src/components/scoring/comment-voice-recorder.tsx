'use client';

import type { useNotesModal } from '@/hooks/useNotesModal';

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, '0')}`;
}

interface CommentVoiceRecorderViewProps {
  recorder: ReturnType<typeof useNotesModal>['voiceRecorder'];
}

/** UI completa do gravador de voz: erro de permissão, gravar, gravando e gravado. */
export function CommentVoiceRecorderView({ recorder }: CommentVoiceRecorderViewProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      {recorder.error && (
        <div className="w-full rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-center">
          <p className="text-red-400 text-xs font-semibold mb-1">{recorder.error}</p>
          <p className="text-telemetry-text-muted text-[10px] leading-tight">
            Clique no cadeado na barra de endereço → Permissões → Microfone → Permitir.
            <br />Depois clique em <span className="text-white font-semibold">Tentar novamente</span>.
          </p>
        </div>
      )}

      {(recorder.state === 'idle' || recorder.error) && (
        <button
          onClick={recorder.startRecording}
          className="w-full py-4 rounded-xl bg-green-600/20 border-2 border-green-500/50 text-green-400 font-bold hover:bg-green-600/30 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
          {recorder.error ? 'Tentar novamente' : 'Gravar nota de voz'}
        </button>
      )}

      {recorder.state === 'recording' && (
        <div className="w-full flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-red-400">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="font-bold text-sm">Gravando...</span>
          </div>
          <p className="text-telemetry-text-muted text-lg font-mono">
            {formatDuration(recorder.durationMs)} / 0:15
          </p>
          <button
            onClick={recorder.stopRecording}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all"
          >
            Parar gravação
          </button>
        </div>
      )}

      {recorder.state === 'recorded' && (
        <div className="w-full flex flex-col items-center gap-3">
          <p className="text-telemetry-text-muted text-sm">
            Duração: {formatDuration(recorder.durationMs)}
          </p>
          <div className="flex gap-2 w-full">
            <button
              onClick={recorder.playPreview}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all text-sm flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Replay
            </button>
            <button
              onClick={recorder.clear}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-telemetry-text-muted font-bold border border-white/10 transition-all text-sm"
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
