'use client';

import { useState } from 'react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';

interface PointDetailsNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteText: string, audio?: { blob: Blob; durationMs: number }) => void;
}

export function PointDetailsNotesModal({
  isOpen,
  onClose,
  onSave,
}: PointDetailsNotesModalProps) {
  const [noteMode, setNoteMode] = useState<'text' | 'voice'>('text');
  const [noteText, setNoteText] = useState('');
  const voiceRecorder = useVoiceRecorder();

  const formatDuration = (ms: number): string => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  };

  const handleSave = () => {
    const audio = voiceRecorder.audioBlob
      ? { blob: voiceRecorder.audioBlob, durationMs: voiceRecorder.durationMs }
      : undefined;
    onSave(noteText.trim(), audio);
    setNoteText('');
    voiceRecorder.clear();
    onClose();
  };

  const handleClear = () => {
    setNoteText('');
    voiceRecorder.clear();
    onClose();
  };

  const hasContent = noteText.trim() || voiceRecorder.audioBlob;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2100] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      role="button"
      tabIndex={-1}
      aria-label="Fechar observações"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div
        className="bg-[#1e293b] rounded-[20px] p-6 mx-4 w-[clamp(280px,80vw,420px)] shadow-2xl border border-white/10"
        role="dialog"
        aria-label="Observações do ponto"
        tabIndex={-1}
      >
        <h3 className="text-white font-bold text-center text-lg mb-1">Observações do Ponto</h3>
        <p className="text-gray-400 text-center text-sm mb-4">Registe detalhes importantes sobre este ponto</p>

        <div className="flex rounded-xl bg-white/5 border border-white/10 p-0.5 mb-4">
          <button
            onClick={() => setNoteMode('text')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              noteMode === 'text'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📝 Texto
          </button>
          <button
            onClick={() => setNoteMode('voice')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              noteMode === 'voice'
                ? 'bg-green-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🎤 Voz
          </button>
        </div>

        {noteMode === 'text' ? (
          <div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Ex: jogador estava cansado, vento forte, etc."
              maxLength={500}
              rows={4}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-gray-500 text-xs text-right mt-1">{noteText.length}/500</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            {voiceRecorder.error && (
              <div className="w-full rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-center">
                <p className="text-red-400 text-xs font-semibold mb-1">{voiceRecorder.error}</p>
                <p className="text-gray-400 text-[10px] leading-tight">
                  Clique no cadeado na barra de endereço → Permissões → Microfone → Permitir.
                  <br />Depois clique em <span className="text-white font-semibold">Tentar novamente</span>.
                </p>
              </div>
            )}

            {(voiceRecorder.state === 'idle' || voiceRecorder.error) && (
              <button
                onClick={voiceRecorder.startRecording}
                className="w-full py-4 rounded-xl bg-green-600/20 border-2 border-green-500/50 text-green-400 font-bold hover:bg-green-600/30 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
                {voiceRecorder.error ? 'Tentar novamente' : 'Gravar nota de voz'}
              </button>
            )}

            {voiceRecorder.state === 'recording' && (
              <div className="w-full flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-red-400">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-bold text-sm">Gravando...</span>
                </div>
                <p className="text-gray-300 text-lg font-mono">
                  {formatDuration(voiceRecorder.durationMs)} / 0:15
                </p>
                <button
                  onClick={voiceRecorder.stopRecording}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all"
                >
                  Parar gravação
                </button>
              </div>
            )}

            {voiceRecorder.state === 'recorded' && (
              <div className="w-full flex flex-col items-center gap-3">
                <p className="text-gray-300 text-sm">
                  Duração: {formatDuration(voiceRecorder.durationMs)}
                </p>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={voiceRecorder.playPreview}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all text-sm flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Replay
                  </button>
                  <button
                    onClick={voiceRecorder.clear}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 font-bold border border-white/10 transition-all text-sm"
                  >
                    Limpar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all text-sm"
          >
            {hasContent ? 'Guardar' : 'Fechar'}
          </button>
          {hasContent && (
            <button
              onClick={handleClear}
              className="w-full py-2.5 rounded-xl bg-transparent text-gray-400 font-bold border border-white/10 hover:bg-white/5 hover:text-white transition-all text-sm"
            >
              Limpar observação
            </button>
          )}
        </div>
      </div>
    </div>
  );
}