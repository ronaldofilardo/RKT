import { useState, useEffect, useReducer, useCallback, useRef } from 'react';
import type { RallyDetails } from '@/core/scoring/types';
import { createPortal } from 'react-dom';
import { formReducer, initialForm, type Vencedor } from './point-details-logic';
import { buildPointDetails } from './PointDetailsModal.confirm.helpers';
import { usePointDetailsScroll } from './usePointDetailsScroll';
import { PointDetailsModalView } from './PointDetailsModal.view';

interface PointDetailsModalProps { winnerPlayerSide: 'player1' | 'player2'; currentServer: 'player1' | 'player2'; player1Name: string; player2Name: string; fontScale: number; onConfirm: (details: RallyDetails, audio?: { blob: Blob; durationMs: number }) => void; onCancel: () => void; }

export function PointDetailsModal({ winnerPlayerSide, currentServer, player1Name, player2Name, onConfirm, onCancel }: PointDetailsModalProps) {
  const [mounted, setMounted] = useState(false); const [showCloseDialog, setShowCloseDialog] = useState(false); const [showNotesModal, setShowNotesModal] = useState(false); const [noteText, setNoteText] = useState(''); const [form, dispatch] = useReducer(formReducer, null, () => initialForm);
  const tipoRef = useRef<HTMLDivElement>(null); const golpeRef = useRef<HTMLDivElement>(null); const duracaoRef = useRef<HTMLDivElement>(null); const subtipo1Ref = useRef<HTMLDivElement>(null); const subtipo2Ref = useRef<HTMLDivElement>(null); const efeitoRef = useRef<HTMLDivElement>(null); const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setMounted(true); }, []);
  const vencedor: Vencedor = winnerPlayerSide === currentServer ? 'sacador' : 'devolvedor'; const winnerName = winnerPlayerSide === 'player1' ? player1Name : player2Name;
  usePointDetailsScroll({ form, vencedor, mounted, containerRef, tipoRef, golpeRef, duracaoRef, subtipo1Ref, subtipo2Ref, efeitoRef });
  useEffect(() => { if (!mounted) return; const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); setShowCloseDialog(true); } }; document.addEventListener('keydown', handleKey); return () => document.removeEventListener('keydown', handleKey); }, [mounted]);
  const handleConfirm = useCallback(() => { const details = buildPointDetails(form, vencedor, noteText); if (details) onConfirm(details, undefined); }, [form, onConfirm, vencedor, noteText]);
  const handleCancel = useCallback(() => setShowCloseDialog(true), []); const handleDiscard = useCallback(() => onCancel(), [onCancel]); const handleSaveNote = useCallback((text: string) => setNoteText(text), []); const handleOpenNotes = useCallback(() => setShowNotesModal(true), []); const handleCloseDialog = useCallback(() => setShowCloseDialog(false), []); const handleCloseNotes = useCallback(() => setShowNotesModal(false), []);
  if (!mounted) return null;
  const refs = { tipoRef, golpeRef, duracaoRef, subtipo1Ref, subtipo2Ref, efeitoRef };
  return createPortal(<PointDetailsModalView vencedor={vencedor} winnerName={winnerName} form={form} dispatch={dispatch} refs={refs} canConfirm={form.golpe != null} noteText={noteText} showCloseDialog={showCloseDialog} showNotesModal={showNotesModal} onConfirm={handleConfirm} onCancel={handleCancel} onOpenNotes={handleOpenNotes} onCloseDialog={handleCloseDialog} onDiscard={handleDiscard} onCloseNotes={handleCloseNotes} onSaveNote={handleSaveNote} />, document.body);
}
