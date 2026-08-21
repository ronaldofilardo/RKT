'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BolasTrocadasModalView } from './BolasTrocadasModal.view';

interface BolasTrocadasModalProps {
  fontScale: number;
  onConfirm: ( bolas: number ) => void;
  onCancel: () => void;
}

export function BolasTrocadasModal({ fontScale, onConfirm, onCancel: _onCancel }: BolasTrocadasModalProps) {
  const [mounted, setMounted] = useState(false);
  const [bolas, setBolas] = useState<string>('');

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

  const handlersRef = useRef({ handleKeyPress, handleBackspace, handleConfirm, handleCancel });
  handlersRef.current = { handleKeyPress, handleBackspace, handleConfirm, handleCancel };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handleKey = (e: KeyboardEvent) => {
      const { handleKeyPress, handleBackspace, handleConfirm, handleCancel } = handlersRef.current;
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
  }, [mounted]);

  const modal = <BolasTrocadasModalView fontScale={fontScale} bolas={bolas} handleKeyPress={handleKeyPress} handleBackspace={handleBackspace} handleConfirm={handleConfirm} handleCancel={handleCancel} />;

  if (!mounted) return null;
  return createPortal(modal, document.body);
}