'use client';

// Barrel — componentes premium do report (Set Lens + Fio do Jogo).
// O arquivo original (1160L) foi dividido em módulos irmãos ≤100L (regra R-03);
// os exports públicos são preservados aqui.
export type { PremiumVisualProps } from './advanced-stats-premium-shared';
export { SetLensSection } from './advanced-stats-set-lens-section';
export { FioDoJogoSection } from './advanced-stats-fio-do-jogo-section';

import { SetLensSection } from './advanced-stats-set-lens-section';
import { FioDoJogoSection } from './advanced-stats-fio-do-jogo-section';

// Aliases públicos (mantidos para compatibilidade)
export const SetLens = SetLensSection;
export const FioDoJogo = FioDoJogoSection;
