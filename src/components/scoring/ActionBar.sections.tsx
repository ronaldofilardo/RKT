import type { ReactNode } from 'react';
export function ActionButton({onClick,disabled,children}:{onClick:()=>void;disabled?:boolean;children:ReactNode}){
  return <button onClick={onClick} disabled={disabled} className="flex items-center justify-center gap-1 px-2 sm:px-3 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold rounded-xl transition-all select-none min-h-[44px] sm:min-h-[48px] active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed bg-telemetry-elevated hover:bg-telemetry-active text-telemetry-text-primary border border-white/10">{children}</button>
}
export function ServeSection({aceDetailsEnabled,onAceDetailsToggle,dfDetailsEnabled,onDfDetailsToggle,showSecondBadge,disabled,onAce,onOut,onNet,step,processing}:{aceDetailsEnabled:boolean;onAceDetailsToggle:()=>void;dfDetailsEnabled:boolean;onDfDetailsToggle:()=>void;showSecondBadge:boolean;disabled:boolean;onAce:()=>void;onOut:(s:'first'|'second')=>void;onNet:(s:'first'|'second')=>void;step:'none'|'second';processing?:boolean}){
  const current=step==='second'?'second':'first';
  return (
    <>
      <div className="flex items-center justify-center gap-1.5">
        <span className={`text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full ${showSecondBadge ? 'bg-telemetry-alert text-telemetry-base' : 'bg-telemetry-blue text-white'}`}>
          {showSecondBadge?'2º SAQUE':'1º SAQUE'}
        </span>
      </div>
      <div className="flex justify-center gap-4">
        <label className="flex items-center gap-2 text-xs text-telemetry-text-muted">
          <input type="checkbox" checked={aceDetailsEnabled} onChange={onAceDetailsToggle} disabled={disabled} className="accent-telemetry-volt bg-telemetry-card" />
          Detalhes do ACE
        </label>
        <label className="flex items-center gap-2 text-xs text-telemetry-text-muted">
          <input type="checkbox" checked={dfDetailsEnabled} onChange={onDfDetailsToggle} disabled={disabled} className="accent-telemetry-volt bg-telemetry-card" />
          Detalhes da DF
        </label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <ActionButton onClick={onAce} disabled={disabled}>{processing?'⏳':'Ace'}</ActionButton>
        <ActionButton onClick={()=>onOut(current)} disabled={disabled}>{processing?'⏳':'Out'}</ActionButton>
        <ActionButton onClick={()=>onNet(current)} disabled={disabled}>{processing?'⏳':'Net'}</ActionButton>
      </div>
    </>
  )
}
export function ActionFooter({canUndo,canEdit,onVoltar,serveStep,onFontSmaller,onFontBigger,onEditScore,onComment,onStats,fontScale,disabled,processing}:{canUndo:boolean;canEdit:boolean;onVoltar:(serveStep:'none'|'second')=>void;serveStep:'none'|'second';onFontSmaller:()=>void;onFontBigger:()=>void;onEditScore:()=>void;onComment?:()=>void;onStats?:()=>void;fontScale:number;disabled:boolean;processing?:boolean}){
  const commentDisabled=Boolean(disabled);
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap text-telemetry-text-primary">
      <button data-testid="undo-button" onClick={() => onVoltar(serveStep)} disabled={!canUndo||disabled} className="text-sm font-semibold bg-telemetry-elevated border border-white/10 px-3 py-2 rounded-lg hover:bg-telemetry-active disabled:opacity-50 flex items-center gap-1"> {processing?'⏳':'↩'} Voltar</button>
      <div className="flex items-center gap-2 bg-telemetry-elevated border border-white/10 px-2 py-1 rounded-lg">
        <button onClick={onFontSmaller} className="px-2 py-1 hover:text-telemetry-volt">A−</button>
        <span className="text-xs font-space-grotesk">{Math.round(fontScale*100)}%</span>
        <button onClick={onFontBigger} className="px-2 py-1 hover:text-telemetry-volt">A+</button>
      </div>
      <div className="flex gap-2">
        {onComment&&<button onClick={onComment} disabled={commentDisabled} className="bg-telemetry-elevated border border-white/10 p-2 rounded-lg hover:bg-telemetry-active disabled:opacity-50">💬</button>}
        {canEdit&&<button onClick={onEditScore} disabled={serveStep==='second'} title={serveStep==='second'?'Finalize a anotação do 2º saque antes de editar o placar':undefined} className="bg-telemetry-elevated border border-white/10 p-2 rounded-lg hover:bg-telemetry-active disabled:opacity-50">✏️</button>}
        {onStats&&<button onClick={onStats} className="bg-telemetry-elevated border border-white/10 p-2 rounded-lg hover:bg-telemetry-active">📊</button>}
      </div>
    </div>
  )
}
