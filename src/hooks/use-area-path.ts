'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { appPath } from '@/core/access/app-path.logic';
import { AREA_PREFIXES, type AreaCode } from '@/core/access/areas';

export function useActiveArea(): AreaCode | null {
  const pathname = usePathname();
  return useMemo(() => {
    if (!pathname) return null;
    for (const [code, prefix] of Object.entries(AREA_PREFIXES)) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        return code as AreaCode;
      }
    }
    return null;
  }, [pathname]);
}

export function useAreaPath(): (path: string) => string {
  const activeArea = useActiveArea();
  return (path: string) => appPath(activeArea, path);
}

