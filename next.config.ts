import path from 'node:path';
import type { NextConfig } from 'next';
import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';

const isProd = process.env.NODE_ENV === 'production';

const cspHeader = [
  "default-src 'self'",
  `script-src 'self'${isProd ? '' : " 'unsafe-eval'"} 'unsafe-inline'`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "connect-src 'self'",
].join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
  { key: 'Content-Security-Policy', value: cspHeader },
];

/**
 * Blindagem preventiva do domínio do sistema (PLANO_SEO_ESTRUTURAL, Fase 5):
 * áreas autenticadas e fluxos de recuperação não devem ser indexados nem
 * rastreados, para não canibalizar a Landing Page (rkt-app.com) nem indexar
 * dados vazios. Lista espelha o matcher de `src/middleware.ts` — as rotas
 * públicas (`/login`, `/signup`, `/termos`, `/privacidade`) ficam de fora.
 */
const noindexHeaders = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];

const noindexSources = [
  '/app', '/admin', '/dashboard', '/painel', '/match', '/matches',
  '/historico', '/dados-pessoais', '/partidasanotadas', '/partidasaovivo',
  '/aguardandoanotador', '/atletas', '/gestor', '/suporte', '/clube',
  '/treinador', '/atleta', '/anotador', '/espectador', '/escolher-area',
  '/forgot', '/trocar-senha', '/help',
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: process.env.NODE_ENV === 'production',
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '192.168.15.6',
    '*.local',
  ],
  typedRoutes: true,
  transpilePackages: ['jose'],
  images: {
    remotePatterns: [],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    tsconfigPath: "./tsconfig.json",
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      ...noindexSources.flatMap((source) => [
        { source, headers: noindexHeaders },
        { source: `${source}/:path*`, headers: noindexHeaders },
      ]),
    ];
  },
  async redirects() {
    return [
      {
        source: '/help/glossario',
        destination: '/help/glosario',
        permanent: true,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

const withMDX = createMDX({
  options: {
    // O App Router roda no React vendorizado do Next (19); o react do projeto é 18.x
    // e seu jsx-runtime quebra ao ler internals renomeados. Aponta o MDX para o
    // mesmo runtime usado pelo resto da aplicação.
    jsxImportSource: 'next/dist/compiled/react',
    remarkPlugins: [remarkGfm],
  },
});

export default withMDX(nextConfig);
