'use client';

import { useEffect, useState } from 'react';
import { EditarClubeModalGestor } from './editar-clube-modal-gestor';

export function ClubInfo() {
  const [club, setClub] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/gestor/club');
      if (!res.ok) throw new Error('Falha ao carregar dados do clube');
      const data = await res.json();
      setClub(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do clube');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="p-6"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-telemetry-blue" /></div>;
  if (error) return <div className="p-6 bg-telemetry-error opacity-10 border border-telemetry-error opacity-20 text-telemetry-error p-6 rounded-xl max-w-md"><h2 className="font-bold mb-2">Erro</h2><p>{error}</p></div>;
  if (!club) return <div className="p-6">Nenhum dado de clube disponível.</div>;

  const addr = club.address || {};
  const addrText = [addr.rua, addr.numero, addr.bairro, addr.cidade, addr.estado, addr.cep].filter(Boolean).join(', ');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-telemetry-text-primary">Dados do Clube</h2>
        <button onClick={() => setEditOpen(true)} className="text-sm text-telemetry-blue hover:underline font-medium">Editar dados do clube</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-telemetry-elevated opacity-50 rounded-lg p-4"><p className="text-xs font-medium text-telemetry-text-muted uppercase">Nome Fantasia</p><p className="text-sm text-telemetry-text-primary">{club.name}</p></div>
        <div className="bg-telemetry-elevated opacity-50 rounded-lg p-4"><p className="text-xs font-medium text-telemetry-text-muted uppercase">Razão Social</p><p className="text-sm text-telemetry-text-primary">{club.legalName || '-'}</p></div>
        <div className="bg-telemetry-elevated opacity-50 rounded-lg p-4"><p className="text-xs font-medium text-telemetry-text-muted uppercase">CNPJ</p><div className="flex items-center gap-2"><p className="text-sm text-telemetry-text-primary">{club.cnpj || '-'}</p><span className="px-2 py-0.5 rounded text-xs font-medium bg-telemetry-elevated text-telemetry-text-muted">Não editável</span></div></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-telemetry-elevated opacity-50 rounded-lg p-4"><p className="text-xs font-medium text-telemetry-text-muted uppercase">Telefone</p><p className="text-sm text-telemetry-text-primary">{club.phone || '-'}</p></div>
        <div className="bg-telemetry-elevated opacity-50 rounded-lg p-4"><p className="text-xs font-medium text-telemetry-text-muted uppercase">E-mail</p><p className="text-sm text-telemetry-text-primary">{club.email || '-'}</p></div>
      </div>
      <div className="bg-telemetry-elevated opacity-50 rounded-lg p-4"><p className="text-xs font-medium text-telemetry-text-muted uppercase mb-1">Endereço do CT</p><p className="text-sm text-telemetry-text-muted">{addrText || '-'}</p></div>
      <div className="bg-telemetry-elevated opacity-50 rounded-lg p-4">
        <p className="text-xs font-medium text-telemetry-text-muted uppercase mb-2">Representante Legal</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-telemetry-text-muted">
          <p><span className="font-medium text-telemetry-text-muted">Nome:</span> {club.legalRepName || '-'}</p>
          <p><span className="font-medium text-telemetry-text-muted">CPF:</span> {club.legalRepCpf || '-'}</p>
          <p><span className="font-medium text-telemetry-text-muted">Telefone:</span> {club.legalRepPhone || '-'}</p>
          <p><span className="font-medium text-telemetry-text-muted">E-mail:</span> {club.legalRepEmail || '-'}</p>
        </div>
      </div>
      {editOpen && club && (
        <EditarClubeModalGestor
          open={editOpen}
          onOpenChange={setEditOpen}
          ct={club}
          onSave={async (data) => {
            const res = await fetch('/api/gestor/club', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!res.ok) throw new Error('Falha ao salvar alterações');
            setEditOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
