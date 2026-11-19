import { ActionFooter } from './ActionBar.sections';
type Props={aceDetailsEnabled:boolean;onAceDetailsToggle:()=>void;dfDetailsEnabled:boolean;onDfDetailsToggle:()=>void;secondServe:boolean;serveStep:'none'|'second';canUndo:boolean;canEdit:boolean;fontScale:number;isFinished:boolean;isProcessing?:boolean;onVoltar:(serveStep:'none'|'second')=>void;onFontSmaller:()=>void;onFontBigger:()=>void;onEditScore:()=>void;onComment?:()=>void;onStats?:()=>void;};
export function ActionBarView(p:Props){
  const disabled=Boolean(p.isFinished||p.isProcessing);
  return (
    <div className="bg-telemetry-card border-t border-white/10 px-2 sm:px-4 py-0.5 sm:py-1 safe-bottom flex-shrink-0">
      <div className="max-w-xl mx-auto">
        <ActionFooter
          canUndo={p.canUndo}
          canEdit={p.canEdit}
          onVoltar={p.onVoltar}
          serveStep={p.serveStep}
          onFontSmaller={p.onFontSmaller}
          onFontBigger={p.onFontBigger}
          onEditScore={p.onEditScore}
          onComment={p.onComment}
          onStats={p.onStats}
          fontScale={p.fontScale}
          disabled={disabled}
          processing={p.isProcessing}
          aceDetailsEnabled={p.aceDetailsEnabled}
          onAceDetailsToggle={p.onAceDetailsToggle}
          dfDetailsEnabled={p.dfDetailsEnabled}
          onDfDetailsToggle={p.onDfDetailsToggle}
        />
      </div>
    </div>
  );
}
