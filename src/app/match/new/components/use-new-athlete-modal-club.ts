'use client';

import { useState, useEffect } from 'react';

interface ClubData {
  uf: string;
  city: string;
  club: string;
}

export function useNewAthleteModalClub({
  isOpen,
  myClub,
  ctId,
}: {
  isOpen: boolean;
  myClub: boolean;
  ctId: string | null;
}) {
  const [clubData, setClubData] = useState<ClubData | null>(null);

  useEffect(() => {
    if (!isOpen || !(myClub && ctId)) return;
    let cancelled = false;
    fetch(`/api/gestor/club`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const ct = data?.data || data;
        const addr = ct?.address || {};
        setClubData({
          uf: (addr.estado || addr.state || '') as string,
          city: (addr.cidade || addr.city || '') as string,
          club: (ct.name || '') as string,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isOpen, myClub, ctId]);

  return { clubData, setClubData };
}