'use client';

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface ServerEffectModalProps {
  context: 'winner' | 'error';
  serveStep: 'first' | 'second';
  errorType?: 'out' | 'net';
  winnerName: string;
  fontScale: number;
  onConfirm: (effect?: string, direction?: string) => void;
  onCancel: () => void;
}

const btnBase = 'px-3 py-2 text-sm rounded-xl border-2 transition-all select-none';
const btnNormal = 'bg-telemetry-elevated border-white/10 text-telemetry-text-muted hover:border-white/20 hover:text-telemetry-text-primary';
const btnActive = 'bg-telemetry-volt/10 border-telemetry-volt text-telemetry-volt shadow-[0_0_8px_rgba(204,255,0,0.3)]';

const EFFECT_OPTIONS = [
  { value: 'topspin', label: 'TopSpin' },
  { value: 'slice', label: 'Slice' },
  { value: 'flat', label: 'Flat' },
] as const;

const DIRECTION_OPTIONS = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'centro', label: 'Centro' },
  { value: 'fechado', label: 'Fechado' },
] as const;

function PillGroup({ options, selected, onChange }: {
  options: readonly { value: string; label: string }[];
  selected: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`${btnBase} ${selected === opt.value ? btnActive : btnNormal}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ServerEffectModal({
  context,
  serveStep,
  errorType,
  winnerName,
  fontScale,
  onConfirm,
  onCancel,
}: ServerEffectModalProps) {
  const [effect, setEffect] = useState<string | null>(null);
  const [direction, setDirection] = useState<string | null>(null);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const isDirty = effect !== null || direction !== null;
  const isDoubleFault = context === 'error' && serveStep === 'second';

  const handleOverlayClick = useCallback(() => {
    if (!isDirty) {
      onCancel();
    } else {
      setShowCloseDialog(true);
    }
  }, [isDirty, onCancel]);

  const handleEffectChange = useCallback((v: string) => setEffect(v), []);
  const handleDirectionChange = useCallback((v: string) => setDirection(v), []);

  const handleConfirm = useCallback(() => {
    onConfirm(effect ?? undefined, direction ?? undefined);
  }, [onConfirm, effect, direction]);

  const handleCancelClick = useCallback(() => {
    if (isDirty) {
      setShowCloseDialog(true);
    } else {
      onCancel();
    }
  }, [isDirty, onCancel]);

  const handleDiscardAndCancel = useCallback(() => {
    setShowCloseDialog(false);
    onCancel();
  }, [onCancel]);

  const headerBorder = 'border-t-4';
  const borderColor = isDoubleFault || (context === 'error' && serveStep === 'first')
    ? '#FF3366' // telemetry-alert
    : '#CCFF00'; // telemetry-volt
  const accentGlow = isDoubleFault || (context === 'error' && serveStep === 'first')
    ? 'rgba(255,51,102,0.15)'
    : 'rgba(204,255,0,0.15)';

  const modal = (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="button"
      tabIndex={-1}
      aria-label="Fechar modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleOverlayClick();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter') handleOverlayClick();
      }}
    >
      <div
        className={`animate-[fadeInSlideUp_0.2s_ease-out] w-[clamp(280px,90vw,400px)] mx-4 rounded-[20px] shadow-2xl flex flex-col ${headerBorder} bg-telemetry-card`}
        style={{
          border: '1px solid rgba(255,255,255,0.1)',
          borderTopWidth: '4px',
          borderTopColor: borderColor,
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${accentGlow}`,
          fontSize: `${fontScale * 100}%`,
        }}
        role="dialog"
        aria-label={context === 'winner' ? 'Efeito do saque' : 'Erro de saque'}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-white/">
          <h2 className="text-center font-bold text-telemetry-text-primary" style={{ fontSize: '1.15rem' }}>
            {context === 'winner' ? '🎾 Efeito do Saque' : `⚠️ Erro de Saque (${errorType === 'out' ? 'Out' : 'Net'})`}
          </h2>
          <p className="text-center text-sm mt-1">
            <span className="font-bold text-telemetry-volt">
              {serveStep === 'first' ? '1º Saque' : '2º Saque'}
            </span>
          </p>
          {isDoubleFault || context === 'winner' ? (
            <p className="text-center text-sm text-telemetry-text-muted mt-0.5">
              Ponto para:{' '}
              <span className={context === 'winner' ? 'text-telemetry-blue font-semibold' : 'text-telemetry-alert font-semibold'}>
                {winnerName}
              </span>
            </p>
          ) : null}
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-[18px]">
          <Section label={context === 'error' ? 'Efeito da Falha (opcional)' : 'Efeito'}>
            <PillGroup options={EFFECT_OPTIONS} selected={effect} onChange={handleEffectChange} />
          </Section>
          <Section label={context === 'error' ? 'Direção da Falha (opcional)' : 'Direção'}>
            <PillGroup options={DIRECTION_OPTIONS} selected={direction} onChange={handleDirectionChange} />
          </Section>

          {isDoubleFault && (
            <p className="text-xs text-telemetry-text-muted italic leading-relaxed bg-gray-800/60 rounded-lg px-3 py-2">
              O ponto já está definido para o adversário por dupla falta.
              Efeito e direção descrevem a falha do sacador.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 flex flex-col gap-2 bg-black/10">
          <button
            onClick={handleConfirm}
            className="w-full py-2.5 rounded-xl font-bold transition-all text-sm bg-telemetry-blue hover:bg-telemetry-active text-white shadow-lg border border-white/10"
          >
            {context === 'winner'
              ? 'Confirmar Ponto'
              : serveStep === 'first'
                ? 'Registrar e Continuar'
                : 'Registrar Dupla Falta'}
          </button>
          <button
            onClick={handleCancelClick}
            className="w-full py-2.5 rounded-xl font-bold text-sm bg-transparent text-telemetry-alert border border-telemetry-alert/60 hover:bg-telemetry-alert/10 hover:border-telemetry-alert transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>

      {showCloseDialog && (
        <div
          className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          role="button"
          tabIndex={-1}
          aria-label="Fechar diálogo"
          onClick={handleDiscardAndCancel}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter') handleDiscardAndCancel();
          }}
        >
          <div
            className="bg-telemetry-card rounded-2xl p-6 mx-4 w-[clamp(240px,70vw,360px)] shadow-2xl border border-white/10"
            role="dialog"
            aria-label="Confirmar descarte"
            tabIndex={-1}
          >
            <p className="text-telemetry-text-primary font-semibold text-center mb-4">Descartar detalhes do saque?</p>
            <div className="flex gap-3">
              <button
                onClick={handleDiscardAndCancel}
                className="flex-1 py-2.5 rounded-xl bg-telemetry-alert/20 text-telemetry-alert font-bold border border-telemetry-alert/30 hover:bg-telemetry-alert/30 transition-all"
              >
                Descartar
              </button>
              <button
                onClick={() => setShowCloseDialog(false)}
                className="flex-1 py-2.5 rounded-xl bg-telemetry-elevated text-telemetry-text-primary font-bold border border-white/10 hover:bg-telemetry-active transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modal, document.body);
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-telemetry-text-muted mb-2">{label}</p>
      {children}
    </div>
  );
}