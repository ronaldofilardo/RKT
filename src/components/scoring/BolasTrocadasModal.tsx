'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface BolasTrocadasModalProps {
  fontScale: number;
  onConfirm: ( bolas: number ) => void;
  onCancel: () => void;
}

const KEYPAD = [
  { value: '1', label: '1', disabled: false },
  { value: '2', label: '2', disabled: false },
  { value: '3', label: '3', disabled: false },
  { value: '4', label: '4', disabled: false },
  { value: '5', label: '5', disabled: false },
  { value: '6', label: '6', disabled: false },
  { value: '7', label: '7', disabled: false },
  { value: '8', label: '8', disabled: false },
  { value: '9', label: '9', disabled: false },
  { value: '0', label: '0', disabled: false },
];

const KEYPAD_ORDER = ['0', '7', '8', '9', '4', '5', '6', '1', '2', '3'];

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
        </div>

        <div className="px-2.5 pb-3">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => handleKeyPress('0')}
              className="relative w-16 h-16 rounded-full flex items-center justify-center select-none cursor-pointer"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #e8f55c 0%, #d4e835 40%, #b8cf28 100%)',
                border: '3px solid #1a1a1a',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 -4px 8px rgba(0,0,0,0.1)',
              }}
            >
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
              >
                <path
                  d="M28,15 C35,25 40,40 38,55 C36,70 30,82 25,90"
                  fill="none"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <path
                  d="M72,15 C65,25 60,40 62,55 C64,70 70,82 75,90"
                  fill="none"
                  stroke="white"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>
              <span className="relative z-10 text-2xl font-bold text-black">0</span>
            </button>
            <div className="grid grid-cols-3 gap-2 justify-items-center">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map(value => {
                const key = KEYPAD.find(k => k.value === value)!;
                return (
                  <button
                    key={key.value}
                    onClick={() => !key.disabled && handleKeyPress(key.value)}
                    className="relative w-16 h-16 rounded-full flex items-center justify-center select-none cursor-pointer"
                    style={{
                      background: 'radial-gradient(circle at 30% 30%, #e8f55c 0%, #d4e835 40%, #b8cf28 100%)',
                      border: '3px solid #1a1a1a',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.3), inset 0 -4px 8px rgba(0,0,0,0.1)',
                    }}
                    disabled={key.disabled}
                  >
                    <svg
                      viewBox="0 0 100 100"
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
                    >
                      <path
                        d="M28,15 C35,25 40,40 38,55 C36,70 30,82 25,90"
                        fill="none"
                        stroke="white"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                      <path
                        d="M72,15 C65,25 60,40 62,55 C64,70 70,82 75,90"
                        fill="none"
                        stroke="white"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="relative z-10 text-2xl font-bold text-black">{key.label}</span>
                  </button>
                );
              })}
            </div>
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
            disabled={bolas === '1' || bolas === '2'}
            className={`w-full py-2 rounded-lg font-bold text-[10px] shadow-lg transition-all ${
              bolas === '1' || bolas === '2'
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
            }`}
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