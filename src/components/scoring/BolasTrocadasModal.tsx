'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface BolasTrocadasModalProps {
  fontScale: number;
  onConfirm: ( bolas: number ) => void;
  onCancel: () => void;
}

const KEYPAD = [
  { value: '1', label: '1', sub: '' },
  { value: '2', label: '2', sub: 'ABC' },
  { value: '3', label: '3', sub: 'DEF' },
  { value: '4', label: '4', sub: 'GHI' },
  { value: '5', label: '5', sub: 'JKL' },
  { value: '6', label: '6', sub: 'MNO' },
  { value: '7', label: '7', sub: 'PQRS' },
  { value: '8', label: '8', sub: 'TUV' },
  { value: '9', label: '9', sub: 'WXYZ' },
  { value: '*', label: '*', sub: '' },
  { value: '0', label: '0', sub: '+' },
  { value: '#', label: '#', sub: '' },
];

export function BolasTrocadasModal({ fontScale, onConfirm, onCancel }: BolasTrocadasModalProps) {
  const [mounted, setMounted] = useState(false);
  const [bolas, setBolas] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mounted, bolas]);

  const handleKeyPress = useCallback((value: string) => {
    setBolas(prev => {
      if (prev.length >= 2) return prev;
      return prev + value;
    });
  }, []);

  const handleBackspace = useCallback(() => {
    setBolas(prev => prev.slice(0, -1));
  }, []);

  const handleConfirm = useCallback(() => {
    const numBolas = bolas === '' ? 0 : parseInt(bolas, 10);
    if (!isNaN(numBolas) && numBolas >= 0) {
      onConfirm(numBolas);
    }
  }, [bolas, onConfirm]);

  const handleCancel = useCallback(() => {
    onConfirm(-1);
  }, [onConfirm]);

  const modal = (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: '-webkit-backdrop-filter blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onClick={handleCancel}
      role="presentation"
    >
      <div
        className="animate-[fadeInSlideUp_0.2s_ease-out] w-[clamp(160px,65vw,210px)] mx-4 rounded-[14px] shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_30px_rgba(59,130,246,0.15)] flex flex-col"
        style={{
          backgroundColor: 'var(--court-surface)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderTop: '3px solid #3b82f6',
          fontFamily: 'var(--font-main)',
          fontSize: `calc(var(--sb-scale) * 0.75em)`,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-2.5 py-2.5 border-b border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <h2 className="text-center font-bold text-white" style={{ fontSize: '0.85rem' }}>
            Bolas Trocadas
          </h2>
          <p className="text-center text-gray-400 dark:text-gray-500 text-[10px] mt-0.5">
            Quantas bolas foram trocadas?
          </p>
        </div>

        <div className="px-2.5 py-3 flex flex-col items-center gap-2.5">
          <div
            className="w-full max-w-[105px] h-10 rounded-lg border-2 border-blue-500/50 bg-gray-800/50 flex items-center justify-center"
            style={{ fontSize: `calc(${fontScale} * 1.5rem)` }}
          >
            <span className="text-white font-bold tabular-nums">
              {bolas === '' ? '0' : bolas}
            </span>
          </div>
          
          {bolas === '' && (
            <p className="text-[9px] text-gray-500 dark:text-gray-400 text-center">
              Toque em 0 ou ignore
            </p>
          )}
        </div>

        <div className="px-2.5 pb-2.5">
          <div className="grid grid-cols-3 gap-1.5">
            {KEYPAD.map(key => (
              <button
                key={key.value}
                onClick={() => handleKeyPress(key.value)}
                className="relative aspect-square rounded-full border-2 border-[#b4c34e]/30 bg-[#b4c34e]/10 hover:bg-[#b4c34e]/20 active:bg-[#b4c34e]/30 transition-all flex flex-col items-center justify-center select-none"
                style={{
                  boxShadow: 'inset 0 0 12px rgba(180,195,78,0.1), 0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                <span className="text-base font-bold text-[#b4c34e]">{key.label}</span>
                {key.sub && (
                  <span className="text-[5px] text-[#b4c34e]/60 uppercase tracking-wider mt-0.5">{key.sub}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="px-2.5 py-2.5 border-t border-white/10 flex flex-col gap-1.5" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
          <div className="flex gap-1.5">
            <button
              onClick={handleBackspace}
              disabled={bolas === ''}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-[10px] ${
                bolas === ''
                  ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              ⌫ Apagar
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 py-1.5 rounded-lg font-bold text-[10px] bg-transparent text-red-400 border-2 border-red-400/60 hover:bg-red-500/10 hover:border-red-400 transition-all"
            >
              Ignorar
            </button>
          </div>
          <button
            onClick={handleConfirm}
            className="w-full py-2 rounded-lg font-bold text-[10px] bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}