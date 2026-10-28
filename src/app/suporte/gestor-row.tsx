'use client';

import type { MembershipItem, UserItem, TrainingCenter } from './types';

interface GestorRowProps {
  membership: MembershipItem;
  user?: UserItem;
  club?: TrainingCenter;
  onEdit: () => void;
  onRevokeSessions: () => void;
  onGenerateLink: () => void;
}

export function GestorRow({
  membership: m,
  user,
  club,
  onEdit,
  onRevokeSessions,
  onGenerateLink,
}: GestorRowProps) {
  const formattedCpf = user?.cpf
    ? user.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : '-';

  return (
    <tr className="border-b border-telemetry-border opacity-10 hover:bg-telemetry-elevated opacity-30">
      <td className="py-3 text-sm text-telemetry-text-primary font-medium">{user?.name || '-'}</td>
      <td className="py-3 text-sm text-telemetry-text-muted font-mono text-xs">{formattedCpf}</td>
      <td className="py-3 text-sm text-telemetry-text-muted">{user?.email || '-'}</td>
      <td className="py-3 text-sm text-telemetry-text-primary">{club?.name || 'Clube não vinculado'}</td>
      <td className="py-3 text-sm">
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
          m.status === 'ACTIVE' ? 'bg-telemetry-volt text-telemetry-volt opacity-20' : 'bg-telemetry-error text-telemetry-error opacity-20'
        }`}>
          {m.status === 'ACTIVE' ? 'Ativo' : 'Suspenso'}
        </span>
      </td>
      <td className="py-3 text-sm whitespace-nowrap text-right">
        <button
          onClick={onGenerateLink}
          className="text-xs text-telemetry-alert hover:underline mr-3 font-medium"
          title="Gerar link de redefinição de senha para o gestor"
        >
          Link Senha
        </button>
        <button
          onClick={onRevokeSessions}
          className="text-xs text-telemetry-error hover:underline mr-3 font-medium"
          title="Derrubar todas as sessões ativas deste gestor"
        >
          Encerrar Sessões
        </button>
        <button
          onClick={onEdit}
          className="text-xs text-telemetry-blue hover:underline font-medium"
        >
          Editar
        </button>
      </td>
    </tr>
  );
}
