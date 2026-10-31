/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { EditarClubeModal } from '../editar-clube-modal';
import { EditarGestorModal } from '../editar-gestor-modal';
import type { TrainingCenter, UserItem } from '../types';

const ct: TrainingCenter = {
  id: 'ct1', name: 'CT Original', slug: 'ct-original', status: 'ACTIVE', cnpj: '11222333000181',
  legalName: 'Razão Original LTDA', phone: '11999990000', email: 'ct@x.com', address: null,
  legalRepName: 'Rep Legal', legalRepEmail: 'rep@x.com', legalRepPhone: '11888880000',
};

const user: UserItem = {
  id: 'u1', name: 'Eduardo Gestor', email: 'eduardo@x.com', cpf: '12345678901',
  role: 'GESTOR', canOperate: true, isActive: true, createdAt: '2026-01-01',
};

describe('EditarClubeModal', () => {
  const onOpenChange = jest.fn();
  const onSave = jest.fn();

  it('exibe CNPJ não editável e campos preenchidos com os dados do clube', () => {
    render(<EditarClubeModal open onOpenChange={onOpenChange} ct={ct} onSave={onSave} />);

    expect(screen.getByText('Editar Clube / CT')).toBeInTheDocument();
    expect(screen.getByText(/CNPJ: 11222333000181/, { selector: 'p' })).toBeInTheDocument();
    expect((screen.getByLabelText('Nome do CT') as HTMLInputElement).value).toBe('CT Original');
    expect((screen.getByLabelText('Slug') as HTMLInputElement).value).toBe('ct-original');
    expect((screen.getByLabelText('Razão Social') as HTMLInputElement).value).toBe('Razão Original LTDA');
    expect((screen.getByLabelText('Nome completo') as HTMLInputElement).value).toBe('Rep Legal');
  });

  it('salva os campos editados e fecha o modal', () => {
    const { container } = render(
      <EditarClubeModal open onOpenChange={onOpenChange} ct={ct} onSave={onSave} />
    );

    fireEvent.change(screen.getByLabelText('Nome do CT'), { target: { value: 'Novo Nome' } });
    fireEvent.submit(container.querySelector('form')!);

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Novo Nome',
      slug: 'ct-original',
      razaoSocial: 'Razão Original LTDA',
    }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('fecha o modal ao cancelar', () => {
    render(<EditarClubeModal open onOpenChange={onOpenChange} ct={ct} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('não renderiza quando fechado', () => {
    const { container } = render(
      <EditarClubeModal open={false} onOpenChange={onOpenChange} ct={ct} onSave={onSave} />
    );
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });
});

describe('EditarGestorModal', () => {
  const onOpenChange = jest.fn();
  const onSave = jest.fn();

  it('exibe dados do gestor e estado das permissões', () => {
    render(<EditarGestorModal open onOpenChange={onOpenChange} user={user} onSave={onSave} />);

    expect(screen.getByText('Editar Gestor')).toBeInTheDocument();
    expect((screen.getByLabelText('Nome completo') as HTMLInputElement).value).toBe('Eduardo Gestor');
    expect((screen.getByLabelText('E-mail') as HTMLInputElement).value).toBe('eduardo@x.com');
    expect((screen.getByLabelText('CPF') as HTMLInputElement).value).toBe('12345678901');
    expect((screen.getByLabelText('Usuário ativo') as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText('Pode operar (anotar partidas)') as HTMLInputElement).checked).toBe(true);
  });

  it('envia os dados editados via onSave e fecha', () => {
    const { container } = render(
      <EditarGestorModal open onOpenChange={onOpenChange} user={user} onSave={onSave} />
    );

    fireEvent.change(screen.getByLabelText('Nome completo'), { target: { value: 'Eduardo Editado' } });
    fireEvent.click(screen.getByLabelText('Usuário ativo'));
    fireEvent.submit(container.querySelector('form')!);

    expect(onSave).toHaveBeenCalledWith({
      name: 'Eduardo Editado', email: 'eduardo@x.com', cpf: '12345678901',
      isActive: false, canOperate: true,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('sincroniza o formulário quando o usuário editado muda', () => {
    const user2: UserItem = { ...user, id: 'u2', name: 'Outro Gestor', email: 'outro@x.com' };
    const { rerender } = render(
      <EditarGestorModal open onOpenChange={onOpenChange} user={user} onSave={onSave} />
    );
    expect((screen.getByLabelText('Nome completo') as HTMLInputElement).value).toBe('Eduardo Gestor');

    act(() => {
      rerender(<EditarGestorModal open onOpenChange={onOpenChange} user={user2} onSave={onSave} />);
    });
    expect((screen.getByLabelText('Nome completo') as HTMLInputElement).value).toBe('Outro Gestor');
  });
});
