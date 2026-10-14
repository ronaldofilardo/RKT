'use client';

import { useState } from 'react';
import type { DashboardMatchPayload } from './MatchCard';
import { useToast } from '@/components/Toast';
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

  // Extrai data e hora iniciais de scheduledAt
  const initialDate = match.scheduledAt
    ? new Date(match.scheduledAt).toISOString().split('T')[0]
    : '';
  const initialTime = match.scheduledAt
    ? new Date(match.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '';

  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [tournamentName, setTournamentName] = useState(match.tournamentName || '');
  const [clubName, setClubName] = useState(match.clubName || '');
  const [category, setCategory] = useState(match.category || '');
  const [round, setRound] = useState(match.round || '');
  const [bracketType, setBracketType] = useState(match.bracketType || '');
  const [courtType, setCourtType] = useState(match.courtType || 'CLAY');
  const [visibility, setVisibility] = useState(match.visibility || 'PUBLIC');
  const [temperature, setTemperature] = useState(
    match.temperature != null ? String(match.temperature) : ''
  );
  const [humidity, setHumidity] = useState(
    match.humidity != null ? String(match.humidity) : ''
  );
  const [details, setDetails] = useState(match.details || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let scheduledAt: string | null = null;
      if (date) {
        if (time && time.includes(':')) {
          const [hours, minutes] = time.split(':');
          const d = new Date(date);
          d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
          scheduledAt = d.toISOString();
        } else {
          const d = new Date(date);
          d.setHours(12, 0, 0, 0);
          scheduledAt = d.toISOString();
        }
      }

      const payload: Record<string, unknown> = {
        scheduledAt,
        tournamentName: tournamentName.trim() || null,
        clubName: clubName.trim() || null,
        category: category.trim() || null,
        round: round.trim() || null,
        bracketType: bracketType.trim() || null,
        courtType: courtType || null,
        visibility: visibility || 'PUBLIC',
        temperature: temperature !== '' ? parseFloat(temperature) : null,
        humidity: humidity !== '' ? parseFloat(humidity) : null,
        details: details.trim() || null,
        version: match.version,
      };

      const res = await fetch(`/api/matches/${match.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Erro ao atualizar informações');
      }

      toast({
        type: 'success',
        message: 'Informações da partida atualizadas com sucesso!',
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        message: err.message || 'Falha ao salvar alterações da partida',
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
                  onChange={(e) => setDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker?.();
                    } catch {
                      // ignore
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
                  onChange={(e) => setTime(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker?.();
                    } catch {
                      // ignore
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
                  onChange={(e) => setTournamentName(e.target.value)}
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
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="Nome do clube"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-white/10 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-telemetry-volt bg-white dark:bg-telemetry-card text-slate-900 dark:text-telemetry-text-primary placeholder-telemetry-text-muted/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-category" className="block text-xs font-medium text-telemetry-text-muted mb-1">
                    Categoria
                  </label>
                  <input
                    id="edit-category"
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
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
                    onChange={(e) => setRound(e.target.value)}
                    placeholder="Ex: Final, Quartas"
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
                onChange={(e) => setCourtType(e.target.value)}
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
                onChange={(e) => setVisibility(e.target.value)}
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
                  onChange={(e) => setTemperature(e.target.value)}
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
                  onChange={(e) => setHumidity(e.target.value)}
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
              onChange={(e) => setDetails(e.target.value)}
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
