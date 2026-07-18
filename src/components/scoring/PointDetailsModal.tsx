'use client';

import { useState, useEffect, useReducer, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { RallyDetails } from '@/core/scoring/types';
import {
  formReducer,
  initialForm,
  getTipoOptions,
  getGolpeOptions,
  shouldShowSubtipo1,
  shouldShowSubtipo2,
  shouldShowEfeito,
  shouldShowDuracao,
  getDirecaoOptions,
  getGolpeEspOptions,
  SITUACAO_OPTIONS,
  TIPO_LABELS,
  TIPO_DESCRIPTIONS,
  GOLPE_LABELS,
  SUBTIPO1_OPTIONS,
  SUBTIPO2_OPTIONS,
  EFEITO_OPTIONS,
  DURACAO_OPTIONS,
  DIRECAO_LABELS,
  GOLPE_ESP_LABELS,
  type Vencedor,
} from './point-details-logic';
import { Section } from './point-details-section';
import { Pills } from './pills-component';

interface PointDetailsModalProps {
  winnerPlayerSide: 'player1' | 'player2';
  currentServer: 'player1' | 'player2';
  player1Name: string;
  player2Name: string;
  fontScale: number;
  onConfirm: (details: RallyDetails) => void;
  onCancel: () => void;
}

export function PointDetailsModal({
  winnerPlayerSide,
  currentServer,
  player1Name,
  player2Name,
  fontScale,
  onConfirm,
  onCancel,
}: PointDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [form, dispatch] = useReducer(formReducer, null, () => initialForm);

  const tipoRef = useRef<HTMLDivElement>(null);
  const golpeRef = useRef<HTMLDivElement>(null);
  const duracaoRef = useRef<HTMLDivElement>(null);
  const subtipo1Ref = useRef<HTMLDivElement>(null);
  const subtipo2Ref = useRef<HTMLDivElement>(null);
  const efeitoRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevFormRef = useRef<typeof form>(form);

  useEffect(() => {
    setMounted(true);
  }, []);

  const vencedor: Vencedor = winnerPlayerSide === currentServer ? 'sacador' : 'devolvedor';
  const winnerName = winnerPlayerSide === 'player1' ? player1Name : player2Name;

  const needsSubtipo1 = form.situacao && form.tipo && shouldShowSubtipo1(vencedor, form.situacao, form.tipo);
  const needsSubtipo2 = form.situacao && form.tipo && form.golpe && shouldShowSubtipo2(form.situacao, form.tipo, form.golpe);
  const needsEfeito = form.golpe != null && shouldShowEfeito(vencedor, form.situacao!, form.tipo!, !!form.subtipo1, !!form.subtipo2);
  const isDirecaoBlocked = form.efeito == null && needsEfeito;

  useEffect(() => {
    if (!mounted) return;
    
    const container = containerRef.current;
    if (!container) return;

    const getTargetRef = () => {
      const prev = prevFormRef.current;
      
      if (form.tipo && !prev.tipo && tipoRef.current) return tipoRef.current;
      // Ao escolher golpe (fase 3), rolar para a próxima fase visível (Duração = fase 4 ou Efeito)
      if (form.golpe && !prev.golpe) {
        if (shouldShowDuracao(form.situacao, form.golpe) && duracaoRef.current) return duracaoRef.current;
        if (needsSubtipo1 && subtipo1Ref.current) return subtipo1Ref.current;
        if (needsEfeito && efeitoRef.current) return efeitoRef.current;
      }
      // Ao escolher duração (fase 4), rolar para a próxima fase visível (fase 5 e 6)
      if (form.duracao && !prev.duracao) {
        if (needsSubtipo1 && subtipo1Ref.current) return subtipo1Ref.current;
        if (needsSubtipo2 && subtipo2Ref.current) return subtipo2Ref.current;
        if (needsEfeito && efeitoRef.current) return efeitoRef.current;
      }
      if (form.subtipo1 && !prev.subtipo1 && subtipo1Ref.current) return subtipo1Ref.current;
      if (form.subtipo2 && !prev.subtipo2 && subtipo2Ref.current) return subtipo2Ref.current;
      if (form.efeito && !prev.efeito && efeitoRef.current) return efeitoRef.current;
      
      return null;
    };

    const targetRef = getTargetRef();
    if (targetRef) {
      const useStart = (form.golpe && !prevFormRef.current.golpe) || (form.duracao && !prevFormRef.current.duracao);
      setTimeout(() => {
        if (typeof targetRef.scrollIntoView === 'function') {
          targetRef.scrollIntoView({ 
            behavior: 'smooth', 
            block: useStart ? 'start' : 'center',
            inline: 'nearest'
          });
        }
      }, 50);
    }
    
    prevFormRef.current = form;
  }, [form.tipo, form.golpe, form.duracao, form.subtipo1, form.subtipo2, form.efeito, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowCloseDialog(true);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mounted]);

  const direcaoOptions = form.efeito || form.situacao ? getDirecaoOptions(form.efeito, form.situacao ?? 'fundo', form.tipo ?? 'winner') : [];
  const golpeEspOptions = form.golpe ? getGolpeEspOptions(form.golpe, form.efeito, vencedor, form.situacao ?? 'fundo', form.tipo ?? 'winner', form.subtipo2, form.direcao) : [];

  const canConfirm = form.golpe != null;

  const handleConfirm = useCallback(() => {
    if (!form.situacao || !form.tipo || !form.golpe) return;
    const isDevolucao = form.situacao === 'devolucao';
    onConfirm({
      vencedor,
      situacao: form.situacao,
      tipo: form.tipo,
      golpe: form.golpe,
      subtipo1: form.subtipo1 ?? undefined,
      subtipo2: form.subtipo2 ?? undefined,
      duracao: form.duracao ?? undefined,
      efeito: form.efeito ?? undefined,
      direcao: form.direcao ?? undefined,
      golpe_esp: form.golpeEsp ?? undefined,
      previewBalls: isDevolucao ? 2 : 1,
    });
  }, [form, onConfirm, vencedor]);

  const handleCancel = useCallback(() => {
    setShowCloseDialog(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: '-webkit-backdrop-filter blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      onClick={handleCancel}
      role="presentation"
    >
      <div
        className="animate-[fadeInSlideUp_0.2s_ease-out] w-[clamp(260px,80vw,480px)] modal-max-w-tablet mx-4 rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.5),0_0_30px_rgba(59,130,246,0.15)] flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--court-surface)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderTop: '3px solid #3b82f6',
          fontFamily: 'var(--font-main)',
          fontSize: `calc(var(--sb-scale) * 1em)`,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="pd-header px-5 py-4 border-b border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <h2 className="text-center font-bold text-white" style={{ fontSize: '1.15rem' }}>
            Vencedor do Ponto
          </h2>
          <div className="flex justify-center mt-2">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: vencedor === 'sacador' ? 'rgba(59,130,246,0.15)' : 'rgba(249,115,22,0.15)',
                color: vencedor === 'sacador' ? '#60a5fa' : '#fb923c',
              }}
            >
              {vencedor === 'sacador' ? '🎾 Sacador' : '↩️ Devolvedor'} — {winnerName}
            </span>
          </div>
        </div>

        <div ref={containerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-[18px]" data-testid="modal-content">
          <Section num="1" label="Situação do Ponto">
            <Pills
              options={SITUACAO_OPTIONS.map(o => o.value)}
              selected={form.situacao}
              onChange={v => dispatch({ type: 'SET_SITUACAO', value: v })}
              labelMap={Object.fromEntries(SITUACAO_OPTIONS.map(o => [o.value, o.label])) as any}
            />
          </Section>

          {form.situacao && (
            <Section num="2" label="Resultado do Ponto" ref={tipoRef}>
              <Pills
                options={getTipoOptions(vencedor, form.situacao)}
                selected={form.tipo}
                onChange={v => dispatch({ type: 'SET_TIPO', value: v })}
                labelMap={TIPO_LABELS}
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                {form.tipo ? TIPO_DESCRIPTIONS[form.tipo] : 'Selecione como o ponto terminou'}
              </p>
            </Section>
          )}

          {form.situacao && form.tipo && (
            <Section num="3" label="Golpe" ref={golpeRef}>
              <Pills
                options={getGolpeOptions(vencedor, form.situacao, form.tipo)}
                selected={form.golpe}
                onChange={v => dispatch({ type: 'SET_GOLPE', value: v })}
                labelMap={GOLPE_LABELS}
              />
            </Section>
          )}

          {shouldShowDuracao(form.situacao, form.golpe) && (
            <Section num="4" label="Duração do Rallye" ref={duracaoRef}>
              <Pills
                options={DURACAO_OPTIONS.map(o => o.value)}
                selected={form.duracao}
                onChange={v => dispatch({ type: 'SET_DURACAO', value: v })}
                labelMap={Object.fromEntries(DURACAO_OPTIONS.map(o => [o.value, o.label])) as any}
              />
            </Section>
          )}

          {needsSubtipo1 && form.golpe && (
            <Section num={shouldShowDuracao(form.situacao, form.golpe) ? '5' : '4'} label="Tipo de Erro (Rede)" ref={subtipo1Ref}>
              <Pills
                options={SUBTIPO1_OPTIONS.map(o => o.value)}
                selected={form.subtipo1}
                onChange={v => dispatch({ type: 'SET_SUBTIPO1', value: v })}
                labelMap={Object.fromEntries(SUBTIPO1_OPTIONS.map(o => [o.value, o.label])) as any}
              />
            </Section>
          )}

          {needsSubtipo2 && form.tipo && (
            <Section num={shouldShowDuracao(form.situacao, form.golpe) ? (needsSubtipo1 ? '6' : '5') : (needsSubtipo1 ? '5' : '4')} label="Onde Errou?" ref={subtipo2Ref}>
              <Pills
                options={SUBTIPO2_OPTIONS.map(o => o.value)}
                selected={form.subtipo2}
                onChange={v => dispatch({ type: 'SET_SUBTIPO2', value: v })}
                labelMap={Object.fromEntries(SUBTIPO2_OPTIONS.map(o => [o.value, o.label])) as any}
              />
            </Section>
          )}

          {needsEfeito && form.golpe && (
            <Section num={
              (shouldShowDuracao(form.situacao, form.golpe) && needsSubtipo1 && needsSubtipo2) ? '7' :
              (shouldShowDuracao(form.situacao, form.golpe) && (needsSubtipo1 || needsSubtipo2)) ? '6' :
              (!shouldShowDuracao(form.situacao, form.golpe) && needsSubtipo1 && needsSubtipo2) ? '6' :
              (shouldShowDuracao(form.situacao, form.golpe) || needsSubtipo1 || needsSubtipo2) ? '5' : '4'
            } label="Efeito" ref={efeitoRef}>
              <Pills
                options={EFEITO_OPTIONS.map(o => o.value)}
                selected={form.efeito}
                onChange={v => dispatch({ type: 'SET_EFEITO', value: v })}
                labelMap={Object.fromEntries(EFEITO_OPTIONS.map(o => [o.value, o.label])) as any}
              />
            </Section>
          )}

          {form.golpe && (
            <Section num="" label="Direção">
              <Pills
                options={direcaoOptions}
                selected={isDirecaoBlocked ? null : form.direcao}
                onChange={v => dispatch({ type: 'SET_DIRECAO', value: v })}
                labelMap={DIRECAO_LABELS}
              />
            </Section>
          )}

          {golpeEspOptions.length > 0 && (
            <Section num="" label="Golpe Especial">
              <Pills
                options={golpeEspOptions}
                selected={form.golpeEsp}
                onChange={v => dispatch({ type: 'SET_GOLPE_ESP', value: v })}
                labelMap={GOLPE_ESP_LABELS}
              />
            </Section>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/10 flex flex-col gap-2" style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`w-full py-2.5 rounded-xl font-bold transition-all text-sm ${
              canConfirm
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                : 'bg-blue-900/40 text-blue-300/40 cursor-not-allowed'
            }`}
          >
            Confirmar Ponto
          </button>
          <button
            onClick={handleCancel}
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
          onClick={handleCancel}
        >
          <div
            className="bg-[#1e293b] rounded-[20px] p-6 mx-4 w-[clamp(240px,70vw,360px)] shadow-2xl border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-white font-bold text-center text-lg mb-1">Descartar detalhes?</p>
            <p className="text-gray-400 dark:text-gray-500 text-center text-sm mb-5">Os dados deste ponto serão perdidos</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setShowCloseDialog(false); onCancel(); }}
                className="w-full py-2.5 rounded-xl bg-red-500/20 text-red-400 font-bold border border-red-400/30 hover:bg-red-500/30 transition-all text-sm"
              >
                Descartar e voltar
              </button>
              <button
                onClick={() => setShowCloseDialog(false)}
                className="w-full py-2.5 rounded-xl bg-white/5 text-gray-300 font-bold border border-white/10 hover:bg-white/10 hover:text-white transition-all text-sm"
              >
                Continuar preenchendo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}