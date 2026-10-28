/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { CadastrarMembroModal } from '../cadastrar-membro-modal';

describe('CadastrarMembroModal', () => {
  it('atualiza a lista assim que o cadastro do treinador é confirmado', async () => {
    const onSave = jest.fn();
    const result = {
      userId: 'coach-1',
      tempPassword: '15031985',
      linkExpiresAt: '2026-11-04T00:00:00.000Z',
      type: 'TREINADOR' as const,
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => result,
    } as Response);

    render(
      <CadastrarMembroModal
        open
        onOpenChange={jest.fn()}
        onSave={onSave}
        fixedType="TREINADOR"
      />,
    );

    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Treinador Teste' } });
    fireEvent.change(screen.getByLabelText('CPF'), { target: { value: '11144477735' } });
    fireEvent.change(screen.getByLabelText('Data de nascimento'), { target: { value: '1985-03-15' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'coach@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByText('Cadastro concluído')).toBeInTheDocument();
    expect(onSave).toHaveBeenCalledWith(result);
    expect(onSave).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar e continuar' }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});
