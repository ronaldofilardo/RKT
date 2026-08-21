interface Props { player:{id:string;name:string}; side:'player1'|'player2'; score:string; progress:number; setsWon:number; isServing:boolean; isWinner:boolean; disabled?:boolean; onClick:(e:React.MouseEvent)=>void; onTouchStart:(e:React.TouchEvent)=>void; onTouchEnd:(e:React.TouchEvent)=>void; }
export function PlayerCardView({player,side,score,progress,setsWon,isServing,isWinner,disabled,onClick,onTouchStart,onTouchEnd}:Props){
  return (
    <button
      className={`relative flex flex-col items-center p-3 sm:p-4 rounded-2xl border-2 transition-all select-none min-h-[140px] sm:min-h-[160px] w-full
        ${side === 'player1' ? 'bg-sky-50 border-sky-200 dark:bg-sky-900/30 dark:border-sky-700' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-700'}
        ${isServing ? 'ring-2 ring-yellow-400 ring-offset-2 dark:ring-offset-slate-900' : ''}
        ${isWinner ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-400 dark:bg-yellow-900/30 dark:border-yellow-600' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98] hover:shadow-md'}`}
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      disabled={disabled}
      aria-label={`+ Ponto ${player.name}`}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 min-w-0 w-full justify-center">
        <span className="font-bold text-sm sm:text-lg text-gray-900 dark:text-gray-100 truncate max-w-[70%]">{player.name}</span>
        {isServing && <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500 animate-pulse flex-shrink-0" aria-label="Sacando" />}
      </div>

      <span className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-gray-100 tabular-nums leading-none mb-1">{score}</span>

      <div className="w-full h-1 sm:h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
        <div
          className={`h-full rounded-full transition-all ${isWinner ? 'bg-yellow-500' : side === 'player1' ? 'bg-sky-500' : 'bg-emerald-500'}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex gap-1 mb-1">
        {Array.from({ length: setsWon }).map((_, i) => (
          <span key={i} className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gray-900" />
        ))}
      </div>

      {!disabled && !isWinner && (
        <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Toque para marcar ponto</span>
      )}
    </button>
  );
}
