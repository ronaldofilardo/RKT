'use client';

// Cabeçalho compacto de /scoring (~36px): seta de voltar + nome do app.
// Cronômetro, ThemeToggle e botão de timeline foram removidos daqui:
// o tema agora é um botão único no rodapé (ActionFooter) e a timeline
// continua acessível pelo relatório.

interface MatchHeaderProps {
  onClose: () => void;
  onEditMatch?: () => void;
  onStats?: () => void;
  /**
   * Mantido apenas por compatibilidade com o fluxo existente em page.tsx
   * (handleOpenTimeline). O ícone da timeline NÃO é mais renderizado no header.
   */
  onTimeline?: () => void;
  canEdit?: boolean;
  isFinished?: boolean;
}

const APP_NAME = 'RKT app';

export function MatchHeader({
  onClose,
  onEditMatch,
  onStats,
  canEdit,
  isFinished,
}: MatchHeaderProps) {
  return (
    <div className="bg-telemetry-card border-b border-white/10 px-2 sm:px-4 py-0.5 flex-shrink-0">
      <div className="flex items-center justify-between gap-1 sm:gap-2 min-h-[32px]">
        <div className="w-8 flex-shrink-0">
          {!isFinished && (
            <button onClick={onClose} className="p-1 text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-white/10 rounded-lg transition-colors -ml-1 min-h-[32px] min-w-[32px] flex items-center justify-center" aria-label="Fechar">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        <span className="flex-1 min-w-0 text-center text-xs sm:text-sm font-semibold tracking-wide text-telemetry-text-muted truncate select-none">
          {APP_NAME}
        </span>

        <div className="min-w-8 flex items-center justify-end gap-1 sm:gap-2 flex-shrink-0">
          {canEdit && onEditMatch && (
            <button onClick={onEditMatch} className="p-1 text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-white/10 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center" aria-label="Editar partida">
              <svg className="w-3.5 sm:w-4 h-3.5 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
          {onStats && (
            <button onClick={onStats} className="p-1 text-telemetry-text-muted hover:text-telemetry-text-primary hover:bg-white/10 rounded-lg transition-colors text-base sm:text-lg leading-none min-h-[32px] min-w-[32px] flex items-center justify-center" aria-label="Estatísticas">≡</button>
          )}
        </div>
      </div>
    </div>
  );
}
