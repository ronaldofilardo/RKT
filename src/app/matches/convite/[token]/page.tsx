'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InviteCard, type InvitePreviewData } from './InviteCard';
import { SpectatorEmptyState } from '@/components/spectate/SpectatorEmptyState';

type InviteErrorCode =
  | 'SPECTATOR_LIMIT'
  | 'ACCESS_EXPIRED'
  | 'MINOR_BROADCAST_NOT_CONSENTED'
  | 'MATCH_PRIVATE'
  | 'CIRCLE_ACCOUNT_REQUIRED'
  | 'NOT_IN_CIRCLE'
  | 'INVITE_INVALID';

const ERROR_STATES: Record<
  Exclude<InviteErrorCode, 'SPECTATOR_LIMIT'>,
  { icon: 'link-off' | 'users' | 'lock'; title: string; description: string; actionText: string; actionHref: string }
> = {
  ACCESS_EXPIRED: {
    icon: 'link-off',
    title: 'Convite expirado',
    description: 'O prazo de 7 dias para acompanhar esta partida encerrada já terminou.',
    actionText: 'Voltar ao início',
    actionHref: '/',
  },
  MINOR_BROADCAST_NOT_CONSENTED: {
    icon: 'lock',
    title: 'Compartilhamento aguardando consentimento',
    description: 'Esta partida envolve menor de idade e exige autorização do responsável legal (ECA Digital / LGPD).',
    actionText: 'Voltar ao início',
    actionHref: '/',
  },
  MATCH_PRIVATE: {
    icon: 'lock',
    title: 'Partida privada',
    description: 'O criador alterou esta partida para Privada e ela não está mais disponível por link.',
    actionText: 'Voltar ao início',
    actionHref: '/',
  },
  CIRCLE_ACCOUNT_REQUIRED: {
    icon: 'lock',
    title: 'Entre com sua conta',
    description: 'Esta partida é restrita aos envolvidos diretos (atletas, responsáveis, treinadores e gestor). Faça login para continuar.',
    actionText: 'Entrar na conta',
    actionHref: '/login',
  },
  NOT_IN_CIRCLE: {
    icon: 'lock',
    title: 'Acesso restrito ao círculo',
    description: 'Apenas atletas, responsáveis, treinadores e gestor vinculados a esta partida podem acompanhá-la.',
    actionText: 'Voltar ao início',
    actionHref: '/',
  },
  INVITE_INVALID: {
    icon: 'link-off',
    title: 'Convite inválido ou expirado',
    description: 'Confira o link ou peça um novo ao dono da partida.',
    actionText: 'Voltar ao início',
    actionHref: '/',
  },
};

export default function SpectatorInviteRedeemPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [errorCode, setErrorCode] = useState<InviteErrorCode | null>(null);
  const [preview, setPreview] = useState<InvitePreviewData | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      try {
        const res = await fetch(`/api/spectate/invite/${token}`);
        const data = await res.json();
        if (res.ok && data.ok) setPreview(data);
        else if (data?.error && data.error in ERROR_STATES) setErrorCode(data.error as InviteErrorCode);
        else setErrorCode('INVITE_INVALID');
      } catch {
        setErrorCode('INVITE_INVALID');
      } finally { setLoading(false); }
    }
    if (token) fetchPreview();
  }, [token]);

  async function handleRedeem() {
    setRedeeming(true);
    setErrorCode(null);
    try {
      const res = await fetch('/api/spectate/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok && data.matchId) router.replace(`/matches/acompanhar/${data.matchId}?token=${encodeURIComponent(token)}` as any);
      else if (data?.error === 'SPECTATOR_LIMIT') setErrorCode('SPECTATOR_LIMIT');
      else if (data?.error && data.error in ERROR_STATES) setErrorCode(data.error as InviteErrorCode);
      else setErrorCode('INVITE_INVALID');
    } catch {
      setErrorCode('INVITE_INVALID');
    } finally { setRedeeming(false); }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-telemetry-bg">
        <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (errorCode || !preview) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-telemetry-bg">
        <div className="max-w-sm w-full bg-telemetry-card border border-telemetry-border/20 rounded-2xl p-5 shadow-xl">
          {errorCode === 'SPECTATOR_LIMIT' ? (
            <SpectatorEmptyState
              icon="users"
              title="Esta partida está lotada"
              description="Já são 5 pessoas acompanhando. Peça ao dono para liberar uma vaga."
              actionText="Tentar de novo"
              onAction={handleRedeem}
            />
          ) : (
            (() => {
              const errState = ERROR_STATES[errorCode ?? 'INVITE_INVALID'];
              return (
                <SpectatorEmptyState
                  icon={errState.icon}
                  title={errState.title}
                  description={errState.description}
                  actionText={errState.actionText}
                  actionHref={errState.actionHref}
                />
              );
            })()
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-telemetry-bg">
      <InviteCard preview={preview} redeeming={redeeming} onRedeem={handleRedeem} />
    </main>
  );
}
