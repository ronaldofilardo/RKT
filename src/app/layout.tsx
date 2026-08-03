import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { Providers } from '@/contexts/Providers';

const inter = Inter({ subsets: ['latin'] });

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
    <html lang="pt-BR">
      <body className={inter.className}>
        <ToastProvider>
          <Providers>{children}</Providers>
        </ToastProvider>
      </body>
    </html>
  );
}
