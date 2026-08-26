import type { ReportData } from './report.types';

const columns = ['ponto', 'set', 'games', 'pontos', 'vencedor', 'tipo', 'sacador', 'situacao', 'golpe', 'efeito', 'direcao', 'zona', 'stroke', 'rally_length', 'rally_duration', 'preview_balls', 'nota', 'audio', 'audio_duration', 'audio_mime', 'anotacoes_json'];

function csvValue(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildReportCsv(report: ReportData): string {
  const rows = report.timelinePoints.map((point) => [
    point.pointNumber,
    point.setNumber,
    `${point.gamesScore.player1}-${point.gamesScore.player2}`,
    `${point.gameScore.player1}-${point.gameScore.player2}`,
    point.winner,
    point.type,
    point.server,
    point.rallyDetails?.situacao,
    point.rallyDetails?.golpe,
    point.rallyDetails?.efeito,
    point.rallyDetails?.direcao,
    point.zone,
    point.stroke,
    point.rallyLength,
    point.rallyDetails?.duracao,
    point.rallyDetails?.previewBalls,
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
