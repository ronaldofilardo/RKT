'use client';

import { useState, useEffect, useReducer, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type {
  RallySituacao,
  RallyTipo,
  RallyGolpe,
  RallySubtipo1,
  RallySubtipo2,
  RallyEfeito,
  RallyDirecao,
  RallyGolpeEsp,
} from '@/core/scoring/types';
import {
  formReducer,
  initialForm,
  getTipoOptions,
  getGolpeOptions,
  shouldShowSubtipo1,
  shouldShowSubtipo2,
  shouldShowEfeito,
  getDirecaoOptions,
  getGolpeEspOptions,
  SITUACAO_OPTIONS,
  TIPO_LABELS,
  TIPO_DESCRIPTIONS,
  GOLPE_LABELS,
  SUBTIPO1_OPTIONS,
  SUBTIPO2_OPTIONS,
  EFEITO_OPTIONS,
  DIRECAO_LABELS,
  GOLPE_ESP_LABELS,
} from './point-details-logic';
import type { PointDetailsForm, Action, Vencedor } from './point-details-logic';
import type { RallyDetails } from '@/core/scoring/types';

interface PointDetailsModalProps {
  winnerPlayerSide: 'player1' | 'player2';
  currentServer: 'player1' | 'player2';
  player1Name: string;
  player2Name: string;
  fontScale: number;
  onConfirm: (details: RallyDetails) => void;
  onCancel: () => void;
}

const btnBase = 'px-3 py-2 text-sm rounded-xl border-2 transition-all select-none';
const btnNormal = 'bg-gray-100 border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-300';
const btnActive = 'bg-blue-50 border-blue-500 text-blue-700 shadow-[0_0_8px_rgba(59,130,246,0.3)] dark:bg-blue-900/30 dark:border-blue-600 dark:text-blue-400';


function Pills<T extends string>({
  options,
  selected,
  onChange,
  labelMap,
}: {
  options: T[];
  selected: T | null;
  onChange: (v: T) => void;
  labelMap: Record<T, string>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`${btnBase} ${selected === opt ? btnActive : btnNormal}`}
        >
          {labelMap[opt]}
        </button>
      ))}
    </div>
  );
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
  const [form, dispatch] = useReducer(formReducer, initialForm);

  useEffect(() => {
    setMounted(true);
    dispatch({ type: 'RESET' });
  }, []);

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

  const vencedor: Vencedor = winnerPlayerSide === currentServer ? 'sacador' : 'devolvedor';
  const winnerName = winnerPlayerSide === 'player1' ? player1Name : player2Name;

  const needsSubtipo1 = form.situacao && form.tipo && shouldShowSubtipo1(vencedor, form.situacao, form.tipo);
  const needsSubtipo2 = form.situacao && form.tipo && form.golpe && shouldShowSubtipo2(form.situacao, form.tipo, form.golpe);
  const needsEfeito = form.golpe != null && shouldShowEfeito(vencedor, form.situacao!, form.tipo!, !!form.subtipo1, !!form.subtipo2);
  const isDirecaoBlocked = form.efeito == null && needsEfeito;


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
      efeito: form.efeito ?? undefined,
      direcao: form.direcao ?? undefined,
      golpe_esp: form.golpeEsp ?? undefined,
      previewBalls: isDevolucao ? 2 : 1,
    });
  }, [form, onConfirm, vencedor]);

  const handleCancel = useCallback(() => {
    setShowCloseDialog(true);
  }, []);

  const modal = (
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
        {/* Header */}
        <div className="pd-header px-5 py-4 border-b border-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <h2 className="text-center font-bold text-white" style={{ fontSize: '1.15rem' }}>
            Detalhes do Ponto
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-[18px]">
          {/* Step 1: Situação */}
          <Section num="1" label="Situação do Ponto">
            <Pills
              options={SITUACAO_OPTIONS.map(o => o.value)}
              selected={form.situacao}
              onChange={v => dispatch({ type: 'SET_SITUACAO', value: v })}
              labelMap={Object.fromEntries(SITUACAO_OPTIONS.map(o => [o.value, o.label])) as Record<RallySituacao, string>}
            />
          </Section>

          {/* Step 2: Resultado */}
          {form.situacao && (
            <Section num="2" label="Resultado do Ponto">
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

          {/* Step 3: Golpe */}
          {form.situacao && form.tipo && (
            <Section num="3" label="Golpe">
              <Pills
                options={getGolpeOptions(vencedor, form.situacao, form.tipo)}
                selected={form.golpe}
                onChange={v => dispatch({ type: 'SET_GOLPE', value: v })}
                labelMap={GOLPE_LABELS}
              />
            </Section>
          )}

          {/* Step 4: Subtipo1 */}
          {needsSubtipo1 && form.golpe && (
            <Section num="4" label="Tipo de Erro (Rede)">
              <Pills
                options={SUBTIPO1_OPTIONS.map(o => o.value)}
                selected={form.subtipo1}
                onChange={v => dispatch({ type: 'SET_SUBTIPO1', value: v })}
                labelMap={Object.fromEntries(SUBTIPO1_OPTIONS.map(o => [o.value, o.label])) as Record<RallySubtipo1, string>}
              />
            </Section>
          )}

          {/* Step 4/5: Subtipo2 */}
          {needsSubtipo2 && form.tipo && (() => {
            const sectionNum = needsSubtipo1 ? 5 : 4;
            return (
              <Section num={String(sectionNum)} label="Onde Errou?">
                <Pills
                  options={SUBTIPO2_OPTIONS.map(o => o.value)}
                  selected={form.subtipo2}
                  onChange={v => dispatch({ type: 'SET_SUBTIPO2', value: v })}
                  labelMap={Object.fromEntries(SUBTIPO2_OPTIONS.map(o => [o.value, o.label])) as Record<RallySubtipo2, string>}
                />
              </Section>
            );
          })()}

          {/* Efeito */}
          {needsEfeito && form.golpe && (() => {
            let sectionLabel = '';
            if (needsSubtipo1 && needsSubtipo2) sectionLabel = '6';
            else if (needsSubtipo1 || needsSubtipo2) sectionLabel = '5';
            else sectionLabel = '4';
            return (
              <Section num={sectionLabel} label="Efeito">
                <Pills
                  options={EFEITO_OPTIONS.map(o => o.value)}
                  selected={form.efeito}
                  onChange={v => dispatch({ type: 'SET_EFEITO', value: v })}
                  labelMap={Object.fromEntries(EFEITO_OPTIONS.map(o => [o.value, o.label])) as Record<RallyEfeito, string>}
                />
              </Section>
            );
          })()}

          {/* Direção */}
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

          {/* Golpe Especial */}
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

        {/* Footer */}
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

      {/* Confirm Close Dialog */}
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
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}

function Section({ num, label, children }: { num?: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
        {num ? `${num}. ` : ''}{label}
      </p>
      {children}
    </div>
  );
}


