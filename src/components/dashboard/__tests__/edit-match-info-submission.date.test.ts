import { buildScheduledAt, initialFormValues } from '../edit-match-info-submission';
import type { DashboardMatchPayload } from '../MatchCard';

describe('edit-match-info-submission - Tratamento de datas sem desvio de fuso', () => {
  it('buildScheduledAt deve construir a data sem subtrair um dia independente do fuso horário local', () => {
    // Usuário selecionou data '2026-10-25' e hora '15:30'
    const resultIso = buildScheduledAt('2026-10-25', '15:30');
    expect(resultIso).not.toBeNull();

    const dateObj = new Date(resultIso!);
    // Ano, mês e dia locais devem bater exatamente com o que o usuário escolheu
    expect(dateObj.getFullYear()).toBe(2026);
    expect(dateObj.getMonth()).toBe(9); // 0-indexed: 9 = outubro
    expect(dateObj.getDate()).toBe(25);
    expect(dateObj.getHours()).toBe(15);
    expect(dateObj.getMinutes()).toBe(30);
  });

  it('buildScheduledAt deve usar meio-dia quando a hora não for fornecida', () => {
    const resultIso = buildScheduledAt('2026-10-25', '');
    expect(resultIso).not.toBeNull();

    const dateObj = new Date(resultIso!);
    expect(dateObj.getFullYear()).toBe(2026);
    expect(dateObj.getMonth()).toBe(9);
    expect(dateObj.getDate()).toBe(25);
    expect(dateObj.getHours()).toBe(12);
    expect(dateObj.getMinutes()).toBe(0);
  });

  it('initialFormValues deve converter scheduledAt para date string local sem perder o dia', () => {
    // Cria uma data representando dia 25 de outubro às 10h local
    const localDate = new Date(2026, 9, 25, 10, 0, 0);
    const match = {
      scheduledAt: localDate.toISOString(),
    } as DashboardMatchPayload;

    const values = initialFormValues(match);
    expect(values.date).toBe('2026-10-25');
  });
});
