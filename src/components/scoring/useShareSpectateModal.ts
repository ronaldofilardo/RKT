'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SpectatorWatcherItem } from './ShareSpectateWatchersList';

export function useShareSpectateModal(matchId: string, isOpen: boolean) {
  const [label, setLabel] = useState('');
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [createdLinkId, setCreatedLinkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [spectators, setSpectators] = useState<SpectatorWatcherItem[]>([]);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}/share-links`);
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.spectators)) {
        setSpectators(data.spectators.map((s: any) => ({
          id: s.id,
          userId: s.userId,
          name: s.user?.name || s.label || 'Acompanhante',
          statusText: s.isOnline ? 'Ao vivo agora' : 'Acompanhando',
          isOnline: s.isOnline ?? true,
          canRemove: true,
        })));
      }
    } catch {}
  }, [matchId]);

  useEffect(() => { if (isOpen) loadData(); }, [isOpen, loadData]);

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setCreateError(null);
    try {
      const res = await fetch(`/api/matches/${matchId}/share-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setCreatedUrl(data.url);
        if (data.linkId) setCreatedLinkId(data.linkId);
      } else {
        setCreateError('Não foi possível criar o convite. Tente de novo.');
      }
    } catch {
      setCreateError('Não foi possível criar o convite. Tente de novo.');
    } finally { setLoading(false); }
  }

  async function revokeLink() {
    if (!createdLinkId) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/share-links/${createdLinkId}`, { method: 'DELETE' });
      if (res.ok) {
        setCreatedUrl(null);
        setCreatedLinkId(null);
        setSpectators([]);
      }
    } finally { setRevoking(false); }
  }

  async function removeSpectator(userId: string) {
    try {
      const res = await fetch(`/api/matches/${matchId}/spectators/${userId}`, { method: 'DELETE' });
      if (res.ok) setSpectators((prev) => prev.filter((s) => s.userId !== userId));
    } catch {}
  }

  function copyLink() {
    if (!createdUrl) return;
    navigator.clipboard.writeText(createdUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return {
    label, setLabel, createdUrl, loading, createError, revoking, copied, spectators,
    createLink, revokeLink, removeSpectator, copyLink,
  };
}
