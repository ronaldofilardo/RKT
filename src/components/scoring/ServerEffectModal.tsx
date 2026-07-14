'use client';

import { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

interface ServerEffectModalProps {
  context: 'winner' | 'error';
  serveStep: 'first' | 'second';
  errorType?: 'out' | 'net';
  winnerName: string;
  fontScale: number;
  onConfirm: (effect?: string, direction?: string) => void;
  onCancel: () => void;
  onLet?: () => void;
  showLetOption?: boolean;
}

const btnBase = 'px-3 py-2 text-sm rounded-xl border-2 transition-all select-none';
const btnNormal = 'bg-gray-100 border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700';
const btnActive = 'bg-blue-50 border-blue-500 text-blue-700 shadow-[0_0_8px_rgba(59,130,246,0.3)]';

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
  onLet,
  showLetOption = false,
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

  const handleLetClick = useCallback(() => {
    if (onLet) {
      onLet();
    }
  }, [onLet]);

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
  const accentGlow = isDoubleFault || context === 'error'
    ? 'var(--clr-yellow-glow)'
    : 'rgba(59,130,246,0.15)';
  const borderColor = isDoubleFault || (context === 'error' && serveStep === 'first')
    ? 'var(--clr-yellow)'
    : '#3b82f6';

  const modal = (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={handleOverlayClick}
    >
      <div
        className={`animate-[fadeInSlideUp_0.2s_ease-out] w-[clamp(280px,90vw,400px)] mx-4 rounded-[20px] shadow-2xl flex flex-col ${headerBorder}`}
        style={{
          backgroundColor: '#1e293b',
          border: '1px solid rgba(255,255,255,0.1)',
          borderTopWidth: '4px',
          borderTopColor: borderColor,
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${accentGlow}`,
          fontFamily: 'Inter, var(--font-main)',
          fontSize: `${fontScale * 100}%`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <h2 className="text-center font-bold text-white" style={{ fontSize: '1.15rem' }}>
            {context === 'winner' ? '🎾 Efeito do Saque' : `⚠️ Erro de Saque (${errorType === 'out' ? 'Out' : 'Net'})`}
          </h2>
          <p className="text-center text-sm mt-1">
            <span className="font-bold text-amber-400">
              {serveStep === 'first' ? '1º Saque' : '2º Saque'}
            </span>
          </p>
          {isDoubleFault || context === 'winner' ? (
            <p className="text-center text-sm text-gray-300 mt-0.5">
              Ponto para:{' '}
              <span className={context === 'winner' ? 'text-blue-400 font-semibold' : 'text-amber-400 font-semibold'}>
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
            <p className="text-xs text-gray-400 italic leading-relaxed bg-gray-800/60 rounded-lg px-3 py-2">
              O ponto já está definido para o adversário por dupla falta.
              Efeito e direção descrevem a falha do sacador.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 flex flex-col gap-2" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
          {context === 'winner' && showLetOption && onLet && (
            <button
              onClick={() => {
                onLet();
                onCancel();
              }}
              className="w-full py-2.5 rounded-xl font-bold text-sm bg-amber-500/20 text-amber-400 border-2 border-amber-400/60 hover:bg-amber-500/30 hover:border-amber-400 transition-all"
            >
              ⚠️ Let (Repetir Saque)
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="w-full py-2.5 rounded-xl font-bold transition-all text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
          >
            {context === 'winner'
              ? 'Confirmar Ponto'
              : serveStep === 'first'
                ? 'Registrar e Continuar'
                : 'Registrar Dupla Falta'}
          </button>
          <button
            onClick={handleCancelClick}
            className="w-full py-2.5 rounded-xl font-bold text-sm bg-transparent text-red-400 border-2 border-red-400/60 hover:bg-red-500/10 hover:border-red-400 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>

      {showCloseDialog && (
        <div
          className="fixed inset-0 z-[2100] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={e => e.stopPropagation()}
        >
          <div
            className="bg-gray-800 rounded-2xl p-6 mx-4 w-[clamp(240px,70vw,360px)] shadow-2xl border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-white font-semibold text-center mb-4">Descartar detalhes do saque?</p>
            <div className="flex gap-3">
              <button
                onClick={handleDiscardAndCancel}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-bold border border-red-400/30 hover:bg-red-500/30 transition-all"
              >
                Descartar
              </button>
              <button
                onClick={() => setShowCloseDialog(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-700 text-gray-200 font-bold border border-gray-600 hover:bg-gray-600 transition-all"
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
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">{label}</p>
      {children}
    </div>
  );
}