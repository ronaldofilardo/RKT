/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { CadastrarMembroModal } from '../cadastrar-membro-modal';

function jsonResponse(body: unknown, ok: boolean, status: number) {
  return { ok, status, json: async () => body } as Response;
}

describe('CadastrarMembroModal - vínculo de atleta com conta existente', () => {
  it('mostra o prompt de vínculo e reenvia linkExisting=true ao confirmar', async () => {
    const onSave = jest.fn();
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            error: 'CONFLICT',
            message: 'Este atleta já possui cadastro no RKT. Deseja vincular a conta ao seu clube?',
            inviteKind: 'ATLETA',
            canLinkExisting: true,
            existingUserName: 'Coah Carter',
          },
          false,
          409,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            message: 'Atleta vinculado com sucesso ao clube.',
            userId: 'u-existing',
            playerId: 'p-2',
            isExistingUser: true,
          },
          true,
          201,
        ),
      );
    global.fetch = fetchMock as typeof fetch;

    render(
      <CadastrarMembroModal open onOpenChange={jest.fn()} onSave={onSave} fixedType="ATLETA" />,
    );

    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Marcos' } });
    fireEvent.change(screen.getByLabelText('CPF'), { target: { value: '63983014046' } });
    fireEvent.change(screen.getByLabelText('Data de nascimento'), { target: { value: '2015-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Atleta' }));

    // Prompt com copy própria de atleta ("elenco do clube", não "equipe técnica").
    expect(
      await screen.findByText(/Quer adicioná-lo ao elenco\?/, { selector: 'p' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Coah Carter')).toBeInTheDocument();
    expect(screen.queryByText(/equipe técnica/)).not.toBeInTheDocument();

    const firstBody = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(firstBody.linkExisting).toBeUndefined();

    fireEvent.click(screen.getByRole('button', { name: 'Sim, vincular' }));

    expect(await screen.findByText('Vínculo feito com sucesso')).toBeInTheDocument();
    expect(
      screen.getByText(/já tinha conta no RKT e agora está vinculado ao clube/, { selector: 'p' }),
    ).toBeInTheDocument();

    const secondBody = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(secondBody.linkExisting).toBe(true);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u-existing', isExistingUser: true }),
    );
  });
});
