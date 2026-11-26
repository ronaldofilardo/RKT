'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InviteCard, type InvitePreviewData } from './InviteCard';
import { InviteErrorView } from './invite-error-view';
import { ERROR_STATES, type InviteErrorCode } from './invite-error-states';

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
        <InviteErrorView errorCode={errorCode} onRetry={handleRedeem} />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-telemetry-bg">
      <InviteCard preview={preview} redeeming={redeeming} onRedeem={handleRedeem} />
    </main>
  );
}
