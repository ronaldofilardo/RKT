/**
 * Regression: remover ranking(s) no modal "Editar Atleta" deve refletir no payload
 * salvo (PUT /api/players/:id) — inclusive zerando rankings quando todos são
 * removidos (o campo `rankings: {}` deve ser enviado, nunca omitido).
 *
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditAthleteModal } from '../EditAthleteModal';

describe('EditAthleteModal - remoção de rankings', () => {
  const baseAthlete = {
    id: 'p1',
    name: 'Eduardo',
    gender: 'MALE',
    birthDate: `${new Date().getFullYear() - 15}-03-15`,
    dominance: 'RIGHT',
    backhand: 'ONE_HANDED',
    rankings: { ESTADUAL: { category: '15-16', class: '4ªMA', position: 3 } },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('envia rankings vazio {} quando o único ranking é removido', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);

    render(
      <EditAthleteModal
        athlete={baseAthlete as any}
        isOpen={true}
        onClose={jest.fn()}
        onSave={onSave}
      />
    );

    const removeButton = screen.getByTitle('Remover este ranking');
    fireEvent.click(removeButton);

    fireEvent.click(screen.getByText('Salvar Alterações'));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0] as { rankings: Record<string, unknown> };
    expect(payload.rankings).toEqual({});
  });

  it('mantém os demais rankings no payload ao remover apenas um deles', async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);

    render(
      <EditAthleteModal
        athlete={
          {
            ...baseAthlete,
            rankings: {
              ESTADUAL: { category: '15-16', class: '4ªMA', position: 3 },
              CBT: { category: '15-16', position: 7 },
            },
          } as any
        }
        isOpen={true}
        onClose={jest.fn()}
        onSave={onSave}
      />
    );

    const [firstRemove] = screen.getAllByTitle('Remover este ranking');
    fireEvent.click(firstRemove);

    fireEvent.click(screen.getByText('Salvar Alterações'));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    const payload = onSave.mock.calls[0][0] as { rankings: Record<string, { position: number }> };
    expect(payload.rankings).toEqual({ CBT: { category: '15-16', position: 7 } });
  });
});