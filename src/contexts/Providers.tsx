'use client';

import { SessionProvider } from './SessionContext';
import { ThemeProvider } from './ThemeContext';
import { FloatingSpectatorProvider } from './FloatingSpectatorContext';
import { FloatingSpectatorHost } from '@/components/spectate/FloatingSpectatorHost';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <FloatingSpectatorProvider>
          {children}
          <FloatingSpectatorHost />
        </FloatingSpectatorProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
