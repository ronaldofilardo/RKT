export interface Club {
  id: string;
  name: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  cnpj: string;
  email: string;
  createdAt: string;
}

interface ClubsTableProps {
  clubs: Club[];
  onStatusChange: (clubId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => Promise<void>;
}

/** Tabela de clubes/CTs com ações de ativar/bloquear. */
export function ClubsTable({ clubs, onStatusChange }: ClubsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-telemetry-border/20">
            <th className="text-left py-3 px-4 font-medium text-telemetry-text-muted">Nome</th>
            <th className="text-left py-3 px-4 font-medium text-telemetry-text-muted">CNPJ</th>
            <th className="text-left py-3 px-4 font-medium text-telemetry-text-muted">E-mail</th>
            <th className="text-left py-3 px-4 font-medium text-telemetry-text-muted">Status</th>
            <th className="text-left py-3 px-4 font-medium text-telemetry-text-muted">Ações</th>
          </tr>
        </thead>
        <tbody>
          {clubs.map((club) => (
            <tr key={club.id} className="border-b border-telemetry-border/10 hover:bg-telemetry-elevated/20">
              <td className="py-3 px-4 text-telemetry-text-primary">{club.name}</td>
              <td className="py-3 px-4 text-telemetry-text-muted font-mono">{club.cnpj}</td>
              <td className="py-3 px-4 text-telemetry-text-muted">{club.email}</td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    club.status === 'ACTIVE'
                      ? 'bg-green-100/30 text-green-700'
                      : club.status === 'SUSPENDED'
                        ? 'bg-red-100/30 text-red-700'
                        : 'bg-yellow-100/30 text-yellow-700'
                  }`}
                >
                  {club.status === 'ACTIVE' ? 'Ativo' : club.status === 'SUSPENDED' ? 'Suspenso' : 'Pendente'}
                </span>
              </td>
              <td className="py-3 px-4 space-x-2">
                {club.status !== 'ACTIVE' && (
                  <button
                    onClick={() => onStatusChange(club.id, 'ACTIVE')}
                    className="text-xs px-2 py-1 rounded bg-sky-500/20 text-sky-600 hover:bg-sky-500/30 font-medium"
                  >
                    Ativar
                  </button>
                )}
                {club.status !== 'SUSPENDED' && (
                  <button
                    onClick={() => onStatusChange(club.id, 'SUSPENDED')}
                    className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-600 hover:bg-red-500/30 font-medium"
                  >
                    Bloquear
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {clubs.length === 0 && (
        <div className="text-center py-8 text-telemetry-text-muted">Nenhum clube disponível.</div>
      )}
    </div>
  );
}
