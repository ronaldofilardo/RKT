import type { Dispatch } from 'react';
import type { PointDetailsForm, Action, Vencedor } from './point-details-logic';
import type { SectionRendererProps } from './SectionRenderer';
import { WinnerInfo } from './WinnerInfo';
import { ModalActions } from './ModalActions';
import { SectionRenderer } from './SectionRenderer';
import { PointDetailsNotesModal } from './PointDetailsNotesModal';
import { PointDetailsCloseDialog } from './PointDetailsCloseDialog';

type ViewProps = { vencedor: Vencedor; winnerName: string; form: PointDetailsForm; dispatch: Dispatch<Action>; refs: SectionRendererProps['refs']; canConfirm: boolean; noteText: string; showCloseDialog: boolean; showNotesModal: boolean; onConfirm: () => void; onCancel: () => void; onOpenNotes: () => void; onCloseDialog: () => void; onDiscard: () => void; onCloseNotes: () => void; onSaveNote: (text: string) => void; };

export function PointDetailsModalView({ vencedor, winnerName, form, dispatch, refs, canConfirm, noteText, showCloseDialog, showNotesModal, onConfirm, onCancel, onOpenNotes, onCloseDialog, onDiscard, onCloseNotes, onSaveNote }: ViewProps) {
  return <div className="fixed inset-0 z-[2000] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: '-webkit-backdrop-filter blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} role="button" tabIndex={-1} aria-label="Fechar modal" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }} onKeyDown={(e) => { if (e.key === 'Escape' || e.key === 'Enter') onCancel(); }}><div className="animate-[fadeInSlideUp_0.2s_ease-out] w-[clamp(260px,80vw,480px)] modal-max-w-tablet mx-4 rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_30px_rgba(59,130,246,0.15)] flex flex-col max-h-[90vh]" style={{ backgroundColor: 'var(--court-surface)', border: '1px solid rgba(255,255,255,0.1)', borderTop: '3px solid #3b82f6', fontFamily: 'var(--font-main)', fontSize: 'calc(var(--sb-scale) * 1em)' }} role="dialog" aria-label="Detalhes do ponto" tabIndex={-1}><WinnerInfo vencedor={vencedor} winnerName={winnerName} /><SectionRenderer form={form} vencedor={vencedor} dispatch={dispatch} refs={refs} /><ModalActions canConfirm={canConfirm} noteText={noteText} onConfirm={onConfirm} onCancel={onCancel} onOpenNotes={onOpenNotes} /></div><PointDetailsCloseDialog isOpen={showCloseDialog} onClose={onCloseDialog} onDiscard={onDiscard} /><PointDetailsNotesModal isOpen={showNotesModal} onClose={onCloseNotes} onSave={onSaveNote} /></div>;
}
