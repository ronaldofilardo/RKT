'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InviteCard, type InvitePreviewData } from './InviteCard';
import { SpectatorEmptyState } from '@/components/spectate/SpectatorEmptyState';

export default function SpectatorInviteRedeemPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [errorCode, setErrorCode] = useState<'SPECTATOR_LIMIT' | 'INVITE_INVALID' | null>(null);
  const [preview, setPreview] = useState<InvitePreviewData | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      try {
        const res = await fetch(`/api/spectate/invite/${token}`);
        const data = await res.json();
        if (res.ok && data.ok) setPreview(data);
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
      else if (res.status === 403 && data.error === 'SPECTATOR_LIMIT') setErrorCode('SPECTATOR_LIMIT');
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
            <SpectatorEmptyState
              icon="link-off"
              title="Convite inválido ou expirado"
              description="Confira o link ou peça um novo ao dono da partida."
              actionText="Voltar ao início"
              actionHref="/dashboard"
            />
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
