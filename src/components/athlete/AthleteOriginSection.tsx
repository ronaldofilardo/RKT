'use client';

import { useState, useEffect } from 'react';
import { BRAZILIAN_UFS, type BrazilianUF } from '@/core/athlete/brazilian-states';

interface AthleteOriginSectionProps {
  uf?: BrazilianUF | null;
  city?: string | null;
  club?: string | null;
  readOnly?: boolean;
  onChange: (fields: { uf: BrazilianUF | null; city: string | null; club: string | null }) => void;
}

export function AthleteOriginSection({
  uf, city, club, readOnly = false, onChange,
}: AthleteOriginSectionProps) {
  const [localUf, setLocalUf] = useState<BrazilianUF | null>(uf ?? null);
  const [localCity, setLocalCity] = useState<string | null>(city ?? null);
  const [localClub, setLocalClub] = useState<string | null>(club ?? null);

  useEffect(() => {
    setLocalUf(uf ?? null);
    setLocalCity(city ?? null);
    setLocalClub(club ?? null);
  }, [uf, city, club]);

  const disabled = readOnly;
  const baseClasses = 'w-full px-3 py-2 border border-white/10 rounded-lg bg-telemetry-elevated text-telemetry-text-primary text-sm focus:border-white/30 focus:outline-none';

  const handleUfChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (disabled) return;
    const value = e.target.value as BrazilianUF;
    const next = BRAZILIAN_UFS.includes(value as BrazilianUF) ? value : null;
    setLocalUf(next);
    onChange({ uf: next, city: localCity, club: localClub });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setLocalCity(e.target.value);
    onChange({ uf: localUf, city: e.target.value, club: localClub });
  };

  const handleClubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    setLocalClub(e.target.value);
    onChange({ uf: localUf, city: localCity, club: e.target.value });
  };

  return (
    <section className="rounded-xl border border-white/10 bg-telemetry-elevated p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="athlete-origin-uf" className="block text-xs font-medium text-telemetry-text-muted mb-1.5">
            Estado (UF)
          </label>
          <select
            id="athlete-origin-uf" value={localUf ?? ''} onChange={handleUfChange}
            disabled={disabled} className={`${baseClasses} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <option value="">Selecione</option>
            {BRAZILIAN_UFS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="athlete-origin-city" className="block text-xs font-medium text-telemetry-text-muted mb-1.5">
            Cidade
          </label>
          <input
            id="athlete-origin-city" type="text" placeholder="Ex: Curitiba"
            value={localCity ?? ''} onChange={handleCityChange} disabled={disabled}
            className={`${baseClasses} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
        </div>
        <div>
          <label htmlFor="athlete-origin-club" className="block text-xs font-medium text-telemetry-text-muted mb-1.5">
            Clube do Atleta
          </label>
          <input
            id="athlete-origin-club" type="text" placeholder="Ex: Clube Curitibano"
            value={localClub ?? ''} onChange={handleClubChange} disabled={disabled}
            className={`${baseClasses} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
        </div>
      </div>
    </section>
  );
}
