'use client';

import { useState } from 'react';
import { Athlete } from '../page';

interface NewAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (athlete: Athlete) => void;
}

export function NewAthleteModal({ isOpen, onClose, onCreated }: NewAthleteModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    gender: '',
    age: '',
    dominance: '',
    backhand: '',
    rankingEstadual: false,
    rankingEstadualPosition: '',
    rankingBrasileiro: false,
    rankingBrasileiroPosition: '',
    rankingCosat: false,
    rankingCosatPosition: '',
    rankingIts: false,
    rankingItsPosition: '',
    rankingWtaAtp: false,
    rankingWtaAtpPosition: '',
  });

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setForm(prev => ({ ...prev, [field]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('access_token');
      
      const rankings: Record<string, number> = {};
      if (form.rankingEstadual && form.rankingEstadualPosition) {
        rankings['ESTADUAL'] = parseInt(form.rankingEstadualPosition);
      }
      if (form.rankingBrasileiro && form.rankingBrasileiroPosition) {
        rankings['BRASILEIRO'] = parseInt(form.rankingBrasileiroPosition);
      }
      if (form.rankingCosat && form.rankingCosatPosition) {
        rankings['COSAT'] = parseInt(form.rankingCosatPosition);
      }
      if (form.rankingIts && form.rankingItsPosition) {
        rankings['ITS'] = parseInt(form.rankingItsPosition);
      }
      if (form.rankingWtaAtp && form.rankingWtaAtpPosition) {
        rankings['WTA_ATP'] = parseInt(form.rankingWtaAtpPosition);
      }

      const res = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          gender: form.gender || undefined,
          age: form.age ? parseInt(form.age) : undefined,
          dominance: form.dominance || undefined,
          backhand: form.backhand || undefined,
          rankings: Object.keys(rankings).length > 0 ? rankings : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Erro ao criar atleta');
      }

      const player = await res.json();

      onCreated({
        id: player.id,
        name: player.name,
        gender: player.gender,
        age: player.age,
        dominance: player.dominance,
        backhand: player.backhand,
        ranking: player.ranking,
      });
      setForm({
        name: '',
        gender: '',
        age: '',
        dominance: '',
        backhand: '',
        rankingEstadual: false,
        rankingEstadualPosition: '',
        rankingBrasileiro: false,
        rankingBrasileiroPosition: '',
        rankingCosat: false,
        rankingCosatPosition: '',
        rankingIts: false,
        rankingItsPosition: '',
        rankingWtaAtp: false,
        rankingWtaAtpPosition: '',
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar atleta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Novo Atleta</h2>
            <p className="text-xs text-gray-500">Preencha os dados do jogador</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl p-1">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={submitting}
              autoFocus
              placeholder="Ex: João Silva"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 placeholder-gray-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
              <select
                value={form.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900"
              >
                <option value="" className="text-gray-900">Selecione...</option>
                <option value="MALE" className="text-gray-900">Masculino</option>
                <option value="FEMALE" className="text-gray-900">Feminino</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Idade</label>
              <input
                type="number"
                min="1"
                max="99"
                value={form.age}
                onChange={(e) => handleChange('age', e.target.value)}
                disabled={submitting}
                placeholder="Ex: 25"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dominância</label>
              <select
                value={form.dominance}
                onChange={(e) => handleChange('dominance', e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900"
              >
                <option value="" className="text-gray-900">Selecione...</option>
                <option value="RIGHT" className="text-gray-900">Destro</option>
                <option value="LEFT" className="text-gray-900">Canhoto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Backhand</label>
              <select
                value={form.backhand}
                onChange={(e) => handleChange('backhand', e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900"
              >
                <option value="" className="text-gray-900">Selecione...</option>
                <option value="ONE_HANDED" className="text-gray-900">Uma mão</option>
                <option value="TWO_HANDED" className="text-gray-900">Duas mãos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ranking</label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="estadual"
                  checked={form.rankingEstadual}
                  onChange={(e) => handleCheckboxChange('rankingEstadual', e.target.checked)}
                  disabled={submitting}
                  className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                />
                <label htmlFor="estadual" className="text-sm text-gray-700 min-w-[80px]">
                  Estadual
                </label>
                {form.rankingEstadual && (
                  <input
                    type="number"
                    min="1"
                    value={form.rankingEstadualPosition}
                    onChange={(e) => handleChange('rankingEstadualPosition', e.target.value)}
                    disabled={submitting}
                    placeholder="Posição"
                    className="flex-1 px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 placeholder-gray-500 text-sm"
                    autoFocus
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="brasileiro"
                  checked={form.rankingBrasileiro}
                  onChange={(e) => handleCheckboxChange('rankingBrasileiro', e.target.checked)}
                  disabled={submitting}
                  className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                />
                <label htmlFor="brasileiro" className="text-sm text-gray-700 min-w-[80px]">
                  Brasileiro
                </label>
                {form.rankingBrasileiro && (
                  <input
                    type="number"
                    min="1"
                    value={form.rankingBrasileiroPosition}
                    onChange={(e) => handleChange('rankingBrasileiroPosition', e.target.value)}
                    disabled={submitting}
                    placeholder="Posição"
                    className="flex-1 px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 placeholder-gray-500 text-sm"
                    autoFocus
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cosat"
                  checked={form.rankingCosat}
                  onChange={(e) => handleCheckboxChange('rankingCosat', e.target.checked)}
                  disabled={submitting}
                  className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                />
                <label htmlFor="cosat" className="text-sm text-gray-700 min-w-[80px]">
                  COSAT
                </label>
                {form.rankingCosat && (
                  <input
                    type="number"
                    min="1"
                    value={form.rankingCosatPosition}
                    onChange={(e) => handleChange('rankingCosatPosition', e.target.value)}
                    disabled={submitting}
                    placeholder="Posição"
                    className="flex-1 px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 placeholder-gray-500 text-sm"
                    autoFocus
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="its"
                  checked={form.rankingIts}
                  onChange={(e) => handleCheckboxChange('rankingIts', e.target.checked)}
                  disabled={submitting}
                  className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                />
                <label htmlFor="its" className="text-sm text-gray-700 min-w-[80px]">
                  ITS
                </label>
                {form.rankingIts && (
                  <input
                    type="number"
                    min="1"
                    value={form.rankingItsPosition}
                    onChange={(e) => handleChange('rankingItsPosition', e.target.value)}
                    disabled={submitting}
                    placeholder="Posição"
                    className="flex-1 px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 placeholder-gray-500 text-sm"
                    autoFocus
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="wta-atp"
                  checked={form.rankingWtaAtp}
                  onChange={(e) => handleCheckboxChange('rankingWtaAtp', e.target.checked)}
                  disabled={submitting}
                  className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                />
                <label htmlFor="wta-atp" className="text-sm text-gray-700 min-w-[80px]">
                  WTA/ATP
                </label>
                {form.rankingWtaAtp && (
                  <input
                    type="number"
                    min="1"
                    value={form.rankingWtaAtpPosition}
                    onChange={(e) => handleChange('rankingWtaAtpPosition', e.target.value)}
                    disabled={submitting}
                    placeholder="Posição"
                    className="flex-1 px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white text-gray-900 placeholder-gray-500 text-sm"
                    autoFocus
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 bg-gray-100 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !form.name.trim()}
              className="flex-1 bg-sky-600 text-white font-semibold py-2.5 rounded-lg hover:bg-sky-700 disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : 'Salvar Atleta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}