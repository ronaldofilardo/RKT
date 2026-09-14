import type { ReportData } from './report.types';

const columns = [
  'no', 'ponto_para', 'sacador', 'games', 'pontos',
  '1s_ace', '1s_out', '1s_net', '1s_efeito', '1s_direcao',
  '2s_ace', '2s_out', '2s_net', '2s_efeito', '2s_direcao',
  'tipo', 'erro', 'onde_errou', 'situacao', 'golpe', 'efeito', 'direcao',
  'especial', 'rally', 'nota', 'audio', 'audio_duration', 'audio_mime', 'anotacoes_json',
];

function csvValue(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function safeScore(score: unknown): string {
  if (
    score &&
    typeof score === 'object' &&
    'player1' in score &&
    'player2' in score &&
    typeof (score as { player1: unknown }).player1 === 'number' &&
    typeof (score as { player2: unknown }).player2 === 'number'
  ) {
    return `${(score as { player1: number }).player1}-${(score as { player2: number }).player2}`;
  }
  return '?-?';
}

export function buildReportCsv(report: ReportData): string {
  const rows = report.timelinePoints.map((point) => [
    point.pointNumber,
    point.server,
    point.server,
    safeScore(point.gamesScore),
    safeScore(point.gameScore),
    point.firstServeOutcome === 'ace' ? 'ACE' : '',
    point.firstServeOutcome === 'out' ? 'OUT' : '',
    point.firstServeOutcome === 'net' ? 'NET' : '',
    point.firstFault?.serveEffect ?? point.serveEffect ?? '',
    point.firstFault?.direction ?? point.serveDirection ?? '',
    point.secondServeOutcome === 'ace' ? 'ACE' : '',
    point.secondServeOutcome === 'out' ? 'OUT' : '',
    point.secondServeOutcome === 'net' ? 'NET' : '',
    point.rallyDetails?.efeito ?? '',
    point.rallyDetails?.direcao ?? '',
    point.type,
    point.rallyDetails?.subtipo1 ?? '',
    point.rallyDetails?.subtipo2 ?? '',
    point.rallyDetails?.situacao,
    point.rallyDetails?.golpe,
    point.rallyDetails?.efeito,
    point.rallyDetails?.direcao,
    point.rallyDetails?.golpe_esp,
    point.rallyDetails?.duracao ?? '',
    point.note,
    point.hasAudioNote ? 'sim' : 'não',
    point.audioNoteDuration,
    point.audioNoteMime,
    point.rawAnnotations ? JSON.stringify(point.rawAnnotations) : '',
  ]);
  return [columns, ...rows].map((row) => row.map(csvValue).join(';')).join('\n');
}

export function downloadReportCsv(report: ReportData): void {
  const blob = new Blob([`\ufeff${buildReportCsv(report)}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `relatorio-${report.matchId}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
