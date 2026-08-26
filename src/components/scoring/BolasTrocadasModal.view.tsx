type Props = {
  fontScale: number;
  bolas: string;
  handleKeyPress: (value: string) => void;
  handleBackspace: () => void;
  handleConfirm: () => void;
  handleCancel: () => void;
};

import { BallKeypad, BallModalActions } from './BolasTrocadasModal.sections';

export function BolasTrocadasModalView({ fontScale, bolas, handleKeyPress, handleBackspace, handleConfirm, handleCancel }: Props) {
  return <div className="fixed inset-0 z-[2000] flex items-center justify-center">
    <button type="button" className="absolute inset-0 cursor-default" aria-label="Fechar modal" onClick={handleCancel} />
    <div className="relative z-10 animate-[fadeInSlideUp_0.2s_ease-out] w-[clamp(160px,65vw,210px)] mx-4 rounded-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_30px_rgba(59,130,246,0.15)] flex flex-col" style={{ backgroundColor: 'var(--court-surface)', border: '1px solid rgba(255,255,255,0.1)', borderTop: '3px solid #3b82f6', fontFamily: 'var(--font-main)', fontSize: 'calc(var(--sb-scale) * 0.75em)' }} role="dialog" aria-modal="true" aria-label="Modal de troca de bolas">
      <header className="px-2.5 py-2.5 border-b border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}><h2 className="text-center font-bold text-white" style={{ fontSize: '0.85rem' }}>Bolas Trocadas</h2><p className="text-center text-gray-400 dark:text-gray-500 text-[10px] mt-0.5">Quantas bolas foram trocadas?</p></header>
      <div className="px-2.5 py-3 flex flex-col items-center gap-2.5"><div className="w-full max-w-[105px] h-10 rounded-lg border-2 border-blue-500/50 bg-gray-800/50 flex items-center justify-center" style={{ fontSize: `calc(${fontScale} * 1.5rem)` }}><span className="text-white font-bold tabular-nums">{bolas === '' ? '0' : bolas}</span></div></div>
      <BallKeypad onPress={handleKeyPress} /><BallModalActions bolas={bolas} onBackspace={handleBackspace} onCancel={handleCancel} onConfirm={handleConfirm} />
    </div>
  </div>;
}
