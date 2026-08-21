import { useState } from 'react';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { NoteModeToggle, TextNoteSection, VoiceNoteSection, NoteActions } from './PointDetailsNotesModal.sections';

interface PointDetailsNotesModalProps { isOpen: boolean; onClose: () => void; onSave: (noteText: string, audio?: { blob: Blob; durationMs: number }) => void; }
function formatDuration(ms: number) { const totalSec = Math.floor(ms / 1000); return `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`; }

export function PointDetailsNotesModal({ isOpen, onClose, onSave }: PointDetailsNotesModalProps) {
  const [noteMode, setNoteMode] = useState<'text' | 'voice'>('text'); const [noteText, setNoteText] = useState(''); const recorder = useVoiceRecorder();
  const handleSave = () => { const audio = recorder.audioBlob ? { blob: recorder.audioBlob, durationMs: recorder.durationMs } : undefined; onSave(noteText.trim(), audio); setNoteText(''); recorder.clear(); onClose(); };
  const handleClear = () => { setNoteText(''); recorder.clear(); onClose(); }; const hasContent = Boolean(noteText.trim() || recorder.audioBlob);
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[2100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} role="button" tabIndex={-1} aria-label="Fechar observações" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}><div className="bg-[#1e293b] rounded-[20px] p-6 mx-4 w-[clamp(280px,80vw,420px)] shadow-2xl border border-white/10" role="dialog" aria-label="Observações do ponto" tabIndex={-1}><h3 className="text-white font-bold text-center text-lg mb-1">Observações do Ponto</h3><p className="text-gray-400 text-center text-sm mb-4">Registe detalhes importantes sobre este ponto</p><NoteModeToggle mode={noteMode} onText={() => setNoteMode('text')} onVoice={() => setNoteMode('voice')} />{noteMode === 'text' ? <TextNoteSection value={noteText} onChange={(e) => setNoteText(e.target.value)} /> : <VoiceNoteSection recorder={recorder} formatDuration={formatDuration} />}<NoteActions hasContent={hasContent} onSave={handleSave} onClear={handleClear} /></div></div>;
}
