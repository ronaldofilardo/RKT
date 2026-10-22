import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { Providers } from '@/contexts/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: 'RKT app',
  description: 'Sistema de gestão e pontuação de tênis',
};

export const viewport: Viewport = {
  // ste-exception R-12: hex literais obrigatórios — <meta name="theme-color"> é
  // lido pelo chrome do navegador ANTES do CSS; não aceita var(--token).
  // Valores espelham --body-bg dark (#0A0F1D) e light (#F1F5F9) em globals.css.
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0A0F1D' },
    { media: '(prefers-color-scheme: light)', color: '#F1F5F9' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  colorScheme: 'light dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var p = localStorage.getItem('rkt_theme_preference');
                  if (p === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else if (p === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }
                } catch (e) {
                  console.warn('[THEME-INIT] Falha ao ler preferência de tema do localStorage:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="font-geist antialiased bg-telemetry-base text-telemetry-text-primary">
        <ToastProvider>
          <Providers>{children}</Providers>
        </ToastProvider>
      </body>
    </html>
  );
}
