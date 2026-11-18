'use client';

import { useGuardianAccessLogs } from './use-guardian-access-logs';
import { GuardianAccountStatusCard } from './guardian-account-status-card';

interface TabAcessosProps {
  playerId?: string;
}

export function GuardianTabAcessos({ playerId }: TabAcessosProps) {
  const { data, loading, refetch } = useGuardianAccessLogs(playerId);

  if (loading) {
    return <div className="py-8 text-center text-xs text-telemetry-text-muted">Carregando log de acessos do menor...</div>;
  }

  return (
    <div className="space-y-6">
      <GuardianAccountStatusCard playerId={playerId} account={data?.account} onReload={refetch} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-telemetry-text-primary flex items-center gap-2">
            <span>📋</span> Log de Acessos Recentes ({data?.logs.length ?? 0})
          </h3>
          <span className="text-[11px] text-telemetry-text-muted">Últimos logins e logouts</span>
        </div>

        {(!data?.logs || data.logs.length === 0) ? (
          <div className="bg-telemetry-card border border-telemetry-border/20 rounded-xl p-6 text-center text-telemetry-text-muted text-xs">
            Nenhum evento de login ou logout registrado para este dependente.
          </div>
        ) : (
          <div className="bg-telemetry-card border border-telemetry-border/30 rounded-xl divide-y divide-telemetry-border/20 shadow-sm overflow-hidden">
            {data.logs.map((log) => {
              const isLogin = log.action === 'USER_LOGIN';
              return (
                <div key={log.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${isLogin ? 'bg-emerald-400' : 'bg-telemetry-text-muted'}`} />
                    <div>
                      <p className="font-semibold text-telemetry-text-primary">
                        {isLogin ? 'Login no aplicativo' : log.action === 'USER_LOGOUT' ? 'Logout / Encerramento de sessão' : log.action}
                      </p>
                      <p className="text-[11px] text-telemetry-text-muted truncate max-w-xs sm:max-w-md">{log.userAgent}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-telemetry-text-muted whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
