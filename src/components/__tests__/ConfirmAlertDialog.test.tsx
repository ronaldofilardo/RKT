/**
 * @jest-environment jsdom
 */
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmAlertDialog } from '../ConfirmAlertDialog';

function setup(overrides: Partial<React.ComponentProps<typeof ConfirmAlertDialog>> = {}) {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  const utils = render(
    <ConfirmAlertDialog
      open
      title="Excluir usuário?"
      description="Esta ação não pode ser desfeita."
      confirmLabel="Excluir"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  );
  return { onConfirm, onCancel, ...utils };
}

describe('ConfirmAlertDialog', () => {
  it('não renderiza nada quando open=false', () => {
    setup({ open: false });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('renderiza role="alertdialog" modal, nomeado pelo título e descrito pela descrição', () => {
    setup();

    const dialog = screen.getByRole('alertdialog', { name: 'Excluir usuário?' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const descriptionId = dialog.getAttribute('aria-describedby');
    expect(descriptionId).toBeTruthy();
    expect(document.getElementById(descriptionId as string)).toHaveTextContent('Esta ação não pode ser desfeita.');
  });

  it('foca o botão Cancelar ao abrir (ação segura)', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  });

  it('chama onConfirm / onCancel pelos botões', () => {
    const { onConfirm, onCancel } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Escape cancela', () => {
    const { onCancel, onConfirm } = setup();

    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('clicar no fundo NÃO fecha o diálogo', () => {
    const { onCancel } = setup();

    fireEvent.click(screen.getByTestId('confirm-alert-dialog-overlay'));
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('prende o foco: Tab no último botão volta ao primeiro e Shift+Tab no primeiro vai ao último', () => {
    setup();
    const dialog = screen.getByRole('alertdialog');
    const cancel = screen.getByRole('button', { name: 'Cancelar' });
    const confirm = screen.getByRole('button', { name: 'Excluir' });

    confirm.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(cancel).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(confirm).toHaveFocus();
  });

  it('em loading desabilita os botões, mostra loadingLabel e ignora Escape', () => {
    const { onCancel } = setup({ loading: true, loadingLabel: 'Excluindo...' });

    expect(screen.getByRole('button', { name: 'Excluindo...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();

    fireEvent.keyDown(screen.getByRole('alertdialog'), { key: 'Escape' });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('variante danger usa a cor de erro no botão de confirmação', () => {
    setup({ variant: 'danger' });
    expect(screen.getByRole('button', { name: 'Excluir' }).className).toContain('bg-telemetry-error');
  });

  it('devolve o foco ao elemento que abriu o diálogo ao fechar', () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>Abrir</button>
          <ConfirmAlertDialog open={open} title="Sair?" onConfirm={() => setOpen(false)} onCancel={() => setOpen(false)} />
        </>
      );
    }
    render(<Harness />);

    const opener = screen.getByRole('button', { name: 'Abrir' });
    opener.focus();
    fireEvent.click(opener);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });
});
