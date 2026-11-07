'use client';

import React from 'react';

export function DetailLegend() {
  return (
    <details className="mt-2 text-[11px] text-telemetry-text-muted">
      <summary className="cursor-pointer select-none">Legenda das abreviações</summary>
      <p className="mt-1 leading-relaxed m-0">
        <strong>DEV</strong> devolução · <strong>FQ</strong> fundo de quadra · <strong>Pass</strong> passada ·{' '}
        <strong>Rede</strong> · <strong>W</strong> winner · <strong>ENF</strong> erro não forçado ·{' '}
        <strong>EF</strong> erro forçado · <strong>FH/BH</strong> forehand/backhand · <strong>Top/Sl/Flat</strong>{' '}
        efeito · <strong>X</strong> cruzada · <strong>Parl</strong> paralela · <strong>Ce</strong> centro ·{' '}
        <strong>In Out/In In</strong> inside-out/in · <strong>1-4, 5-8, +9</strong> bolas no rallye
      </p>
    </details>
  );
}