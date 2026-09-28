import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { Providers } from '@/contexts/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: 'Racket App',
  description: 'Sistema de gestão e pontuação de tênis',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className={`font-geist antialiased bg-telemetry-base text-telemetry-text-primary`}>
        <ToastProvider>
          <Providers>{children}</Providers>
        </ToastProvider>
      </body>
    </html>
  );
}
