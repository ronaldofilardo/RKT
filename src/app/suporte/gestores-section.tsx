'use client';

import { useState } from 'react';
import type { MembershipItem, UserItem, TrainingCenter } from './types';
import { EditarGestorModal } from './editar-gestor-modal';
import { LinkCopyModal } from '@/app/gestor/link-copy-modal';
import { GestorRow } from './gestor-row';
import { useToast } from '@/components/Toast';
import { extractErrorMessage } from '@/lib/error-parser';

interface GestoresSectionProps {
  memberships: MembershipItem[];
  users: UserItem[];
  clubs: TrainingCenter[];
  onEdit: (userId: string, data: any) => Promise<void>;
  onRefresh?: () => void;
}

export function GestoresSection({ memberships, users, clubs, onEdit, onRefresh }: GestoresSectionProps) {
  const gestores = memberships.filter((m) => m.kind === 'GESTOR');
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [linkData, setLinkData] = useState<{ open: boolean; name: string; token: string; expiresAt?: string }>({
    open: false, name: '', token: '',
  });
  const { toast } = useToast();

  const handleGenerateLink = async (user?: UserItem) => {
    if (!user) return;
    try {
      const res = await fetch('/api/support/password-resets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Erro ao gerar link');
      setLinkData({ open: true, name: user.name, token: data.token, expiresAt: data.expiresAt });
      onRefresh?.();
    } catch (err) {
      toast({ type: 'error', message: extractErrorMessage(err, 'Erro ao gerar link de senha') });
    }
  };

  const handleRevokeSessions = async (user?: UserItem) => {
    if (!user) return;
    if (!confirm(`Deseja derrubar todas as sessões ativas de ${user.name}?`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}/revoke-sessions`, { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao revogar sessões');
      toast({ type: 'success', message: `Sessões de ${user.name} foram revogadas com sucesso.` });
    } catch (err) {
      toast({ type: 'error', message: extractErrorMessage(err, 'Erro ao revogar sessões') });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold text-telemetry-text-primary">Gestão de Gestores</h2>
          <p className="text-xs text-telemetry-text-muted">Controle de gestores, links de senha e revogação de acessos</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-telemetry-border/20 text-sm font-medium text-telemetry-text-muted">
              <th className="pb-3">Gestor</th><th className="pb-3">CPF</th><th className="pb-3">E-mail</th>
              <th className="pb-3">Clube Vinculado</th><th className="pb-3">Status</th><th className="pb-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {gestores.map((m) => {
              const user = users.find((u) => u.id === m.userId);
              const ct = clubs.find((c) => c.id === m.ctId);
              return (
                <GestorRow key={m.id} membership={m} user={user} club={ct} onEdit={() => setEditingUser(user || null)} onRevokeSessions={() => handleRevokeSessions(user)} onGenerateLink={() => handleGenerateLink(user)} />
              );
            })}
            {gestores.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-telemetry-text-muted text-sm">Nenhum gestor cadastrado na plataforma.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {editingUser && (
        <EditarGestorModal open={Boolean(editingUser)} onOpenChange={(op) => !op && setEditingUser(null)} user={editingUser} onSave={async (d) => { await onEdit(editingUser.id, d); setEditingUser(null); onRefresh?.(); }} />
      )}
      <LinkCopyModal open={linkData.open} onOpenChange={(op) => setLinkData((prev) => ({ ...prev, open: op }))} title="Link de Redefinição de Senha" recipientName={linkData.name} token={linkData.token} expiresAt={linkData.expiresAt} />
    </div>
  );
}
