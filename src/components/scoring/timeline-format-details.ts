import type { RallyDetails } from '@/schemas/contracts';
import { tipoLabel, situacaoLabel, golpeLabel, direcaoLabel, efeitoLabel, golpeEspLabel, subtipo1Label, subtipo2Label, vencedorLabel } from './timeline-format-labels';

const DASH = '–';
const emptyDetails = (): FormattedPointDetails => ({
  short: DASH, full: DASH, tipo: DASH, situacao: DASH, golpe: DASH,
  direcao: DASH, efeito: DASH, golpeEsp: DASH, subtipo1: DASH, subtipo2: DASH,
});

interface FormattedPointDetails {
  short: string;
  full: string;
  tipo: string;
  situacao: string;
  golpe: string;
  direcao: string;
  efeito: string;
  golpeEsp: string;
  subtipo1: string;
  subtipo2: string;
}

export function formatPointDetails(rd?: RallyDetails | null): FormattedPointDetails {
  if (!rd) return emptyDetails();

  const tipo = tipoLabel(rd.tipo);
  const situacao = situacaoLabel(rd.situacao);
  const golpe = golpeLabel(rd.golpe);
  const direcao = direcaoLabel(rd.direcao);
  const efeito = efeitoLabel(rd.efeito);
  const golpeEsp = golpeEspLabel(rd.golpe_esp);
  const subtipo1 = subtipo1Label(rd.subtipo1);
  const subtipo2 = subtipo2Label(rd.subtipo2);
  const vencedor = vencedorLabel(rd.vencedor);

  const parts: string[] = [vencedor];
  parts.push(situacao);
  parts.push(tipo);
  if (rd.golpe) parts.push(golpe);
  if (rd.subtipo1) parts.push(subtipo1);
  if (rd.subtipo2) parts.push(subtipo2);
  if (rd.efeito) parts.push(efeito);
  if (rd.direcao) parts.push(direcao);
  if (rd.golpe_esp) parts.push(golpeEsp);

  return {
    short: `${situacao} • ${golpe}`,
    full: parts.filter(Boolean).join(' • '),
    tipo,
    situacao,
    golpe,
    direcao,
    efeito,
    golpeEsp,
    subtipo1,
    subtipo2,
  };
}

export function formatPointDetailsShort(rd?: RallyDetails | null): string {
  return formatPointDetails(rd).short;
}

export function formatPointDetailsFull(rd?: RallyDetails | null): string {
  return formatPointDetails(rd).full;
}

export function getPointDetailSummary(rd?: RallyDetails | null): {
  label: string;
  color: 'green' | 'red' | 'amber' | 'gray';
} {
  if (!rd) return { label: '–', color: 'gray' };

  if (rd.tipo === 'winner') {
    return { label: 'W', color: 'green' };
  }
  if (rd.tipo === 'erro_nao_forcado') {
    return { label: 'ENF', color: 'red' };
  }
  if (rd.tipo === 'erro_forcado') {
    return { label: 'EF', color: 'amber' };
  }
  if (rd.tipo === 'dupla_falta') {
    return { label: 'DF', color: 'red' };
  }
  return { label: tipoLabel(rd.tipo), color: 'gray' };
}
