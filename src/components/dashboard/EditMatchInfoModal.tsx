'use client';

import { useState } from 'react';
import type { DashboardMatchPayload } from './match-card-types';
import {
  buildUpdateInfoPayload,
  initialFormValues,
} from './edit-match-info-submission';
import { useToast } from '@/components/Toast';
import { matchesClient } from '@/services/matchesClient';
import { COURT_TYPES } from '@/app/match/new/matchConstants';

interface EditMatchInfoModalProps {
  match: DashboardMatchPayload;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditMatchInfoModal({
  match,
  onClose,
  onSuccess,
}: EditMatchInfoModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [values, setValues] = useState(() => initialFormValues(match));
  const setValue = <K extends keyof typeof values>(key: K, value: (typeof values)[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const { date, time, tournamentName, clubName, category, round, bracketType, courtType, visibility, temperature, humidity, details } = values;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await matchesClient.updateMatchInfo(
        match.id,
        buildUpdateInfoPayload(values, match.version)
      );

      toast({
        type: 'success',
        message: 'Informações da partida atualizadas com sucesso!',
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        type: 'error',
        message:
          (error instanceof Error ? error.message : undefined) ||
          'Falha ao salvar alterações da partida',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-match-info-title"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-telemetry-elevated border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col z-10 overflow-hidden">
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-telemetry-card">
          <div>
            <h2 id="edit-match-info-title" className="text-base font-bold text-telemetry-text-primary">
              ⚙️ Editar Informações da Partida
            </h2>
            <p className="text-xs text-telemetry-text-muted mt-0.5">
              {match.player1.name} vs {match.player2.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-telemetry-text-muted hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Formulário com Scroll */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 scrollbar-thin">
          {/* DATA E HORÁRIO */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-telemetry-text-muted mb-2">
              Data e Horário
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-match-date" className="block text-xs font-medium text-telemetry-text-muted mb-1">
                  Data
                </label>
                <input
                  id="edit-match-date"
                  type="date"
                  value={date}
                  onChange={(e) => setValue('date', e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker?.();
                    } catch {
                      // ste-exception R-08: showPicker() lança quando o browser não
                      // suporta ou o picker já está aberto. Degradação silenciosa esperada.
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-white dark:bg-telemetry-card text-slate-900 dark:text-telemetry-text-primary cursor-pointer"
                />
              </div>
              <div>
                <label htmlFor="edit-match-time" className="block text-xs font-medium text-telemetry-text-muted mb-1">
                  Horário (opcional)
                </label>
                <input
                  id="edit-match-time"
                  type="time"
                  value={time}
                  onChange={(e) => setValue('time', e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker?.();
                    } catch {
                      // ste-exception R-08: showPicker() lança quando o browser não
                      // suporta ou o picker já está aberto. Degradação silenciosa esperada.
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-white dark:bg-telemetry-card text-slate-900 dark:text-telemetry-text-primary cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* TORNEIO E CATEGORIA */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-telemetry-text-muted mb-2">
              Torneio e Chave
            </h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="edit-tournament" className="block text-xs font-medium text-telemetry-text-muted mb-1">
                  Nome do Torneio
                </label>
                <input
                  id="edit-tournament"
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setValue('tournamentName', e.target.value)}
                  placeholder="Ex: Torneio Aberto"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-white dark:bg-telemetry-card text-slate-900 dark:text-telemetry-text-primary placeholder-telemetry-text-muted/40"
                />
              </div>

              <div>
                <label htmlFor="edit-club" className="block text-xs font-medium text-telemetry-text-muted mb-1">
                  Clube <span className="text-telemetry-text-muted font-normal">(opcional)</span>
                </label>
                <input
                  id="edit-club"
                  type="text"
                  value={clubName}
                  onChange={(e) => setValue('clubName', e.target.value)}
                  placeholder="Nome do clube"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-white dark:bg-telemetry-card text-slate-900 dark:text-telemetry-text-primary placeholder-telemetry-text-muted/40"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="edit-category" className="block text-xs font-medium text-telemetry-text-muted mb-1">
                    Categoria
                  </label>
                  <input
                    id="edit-category"
                    type="text"
                    value={category}
                    onChange={(e) => setValue('category', e.target.value)}
                    placeholder="Ex: 1ª Classe"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-white dark:bg-telemetry-card text-slate-900 dark:text-telemetry-text-primary placeholder-telemetry-text-muted/40"
                  />
                </div>
                <div>
                  <label htmlFor="edit-round" className="block text-xs font-medium text-telemetry-text-muted mb-1">
                    Rodada
                  </label>
                  <input
                    id="edit-round"
                    type="text"
                    value={round}
                    onChange={(e) => setValue('round', e.target.value)}
                    placeholder="Ex: Final, Quartas"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-white dark:bg-telemetry-card text-slate-900 dark:text-telemetry-text-primary placeholder-telemetry-text-muted/40"
                  />
                </div>
                <div>
                  <label htmlFor="edit-bracket-type" className="block text-xs font-medium text-telemetry-text-muted mb-1">
                    Chave
                  </label>
                  <input
                    id="edit-bracket-type"
                    type="text"
                    value={bracketType}
                    onChange={(e) => setValue('bracketType', e.target.value)}
                    placeholder="Ex: Principal"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-white dark:bg-telemetry-card text-slate-900 dark:text-telemetry-text-primary placeholder-telemetry-text-muted/40"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* QUADRA E VISIBILIDADE */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-court-type" className="block text-xs font-medium text-telemetry-text-muted mb-1">
                Tipo de Quadra
              </label>
              <select
                id="edit-court-type"
                value={courtType}
                onChange={(e) => setValue('courtType', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-white dark:bg-telemetry-card text-slate-900 dark:text-telemetry-text-primary cursor-pointer"
              >
                {COURT_TYPES.map((court) => (
                  <option key={court.value} value={court.value}>
                    {court.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-visibility" className="block text-xs font-medium text-telemetry-text-muted mb-1">
                Visibilidade
              </label>
              <select
                id="edit-visibility"
                value={visibility}
                onChange={(e) => setValue('visibility', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-white dark:bg-telemetry-card text-slate-900 dark:text-telemetry-text-primary cursor-pointer"
              >
                <option value="PUBLIC">Pública</option>
                <option value="PRIVATE">Privada</option>
              </select>
            </div>
          </div>

          {/* CONDIÇÕES CLIMÁTICAS */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-telemetry-text-muted mb-2">
              Condições Climáticas (opcional)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-temp" className="block text-xs font-medium text-telemetry-text-muted mb-1">
                  Temperatura (°C)
                </label>
                <input
                  id="edit-temp"
                  type="number"
                  value={temperature}
                  onChange={(e) => setValue('temperature', e.target.value)}
                  placeholder="Ex: 25"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-white dark:bg-telemetry-card text-slate-900 dark:text-telemetry-text-primary placeholder-telemetry-text-muted/40"
                />
              </div>
              <div>
                <label htmlFor="edit-humidity" className="block text-xs font-medium text-telemetry-text-muted mb-1">
                  Umidade (%)
                </label>
                <input
                  id="edit-humidity"
                  type="number"
                  value={humidity}
                  onChange={(e) => setValue('humidity', e.target.value)}
                  placeholder="Ex: 60"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-white dark:bg-telemetry-card text-slate-900 dark:text-telemetry-text-primary placeholder-telemetry-text-muted/40"
                />
              </div>
            </div>
          </div>

          {/* DETALHES */}
          <div>
            <label htmlFor="edit-details" className="block text-xs font-bold uppercase tracking-wider text-telemetry-text-muted mb-1">
              Detalhes / Observações
            </label>
            <textarea
              id="edit-details"
              value={details}
              onChange={(e) => setValue('details', e.target.value)}
              placeholder="Observações ou detalhes adicionais da partida"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-white dark:bg-telemetry-card text-slate-900 dark:text-telemetry-text-primary placeholder-telemetry-text-muted/40 resize-y"
            />
          </div>

          {/* Botões */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-medium text-telemetry-text-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-telemetry-blue hover:bg-telemetry-blue-light rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
