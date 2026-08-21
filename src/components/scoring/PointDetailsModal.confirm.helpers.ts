import type { RallyDetails } from '@/core/scoring/types';
import type { PointDetailsForm, Vencedor } from './point-details-logic';

function getRequiredDetails(form: PointDetailsForm, vencedor: Vencedor) {
  if (!form.situacao || !form.tipo || !form.golpe) return null;
  return { vencedor, situacao: form.situacao, tipo: form.tipo, golpe: form.golpe };
}
function getTechniquePartOne(form: PointDetailsForm) { return { subtipo1: form.subtipo1 ?? undefined, subtipo2: form.subtipo2 ?? undefined, duracao: form.duracao ?? undefined }; }
function getTechniquePartTwo(form: PointDetailsForm) { return { efeito: form.efeito ?? undefined, direcao: form.direcao ?? undefined, golpe_esp: form.golpeEsp ?? undefined }; }
function getOptionalDetails(form: PointDetailsForm, noteText: string) { return { ...getTechniquePartOne(form), ...getTechniquePartTwo(form), previewBalls: form.situacao === 'devolucao' ? 2 : 1, note: noteText.trim() || undefined }; }
export function buildPointDetails(form: PointDetailsForm, vencedor: Vencedor, noteText: string): RallyDetails | null { const required = getRequiredDetails(form, vencedor); return required ? { ...required, ...getOptionalDetails(form, noteText) } : null; }
