# Tech Stack & Ecosystem Standards

## Core Tech Stack
- **Frontend / Fullstack**: Next.js (App Router), React, TypeScript.
- **Styling**: Tailwind CSS, Shadcn UI / Radix Primitives, CSS Variables para theming.
- **Backend / APIs**: Next.js API Route Handlers ou Node/FastAPI quando microsserviço.
- **Database**: PostgreSQL / SQLite com Prisma ORM ou Drizzle ORM.
- **Package Manager**: pnpm (padrão preferencial em C:\apps).
- **CLI & Token Optimization**: **RTK** (`rtk git`, `rtk pnpm`, `rtk tsc`, etc.) para filtragem inteligente de ruídos e economia de tokens.

## Diretrizes Gerais de Implementação
1. **Tipagem Estrita**: Não usar `any`. Criar interfaces ou tipos bem definidos para payloads, respostas e entidades.
2. **Componentes Server vs Client**: No Next.js App Router, manter componentes como Server Components (`RSC`) por padrão; use `'use client'` estritamente nas folhas da árvore (onde há interatividade/estado local).
3. **Gerenciamento de Estado**: Preferir estados via URL (searchParams) ou Server State/actions. Usar Zustand/Context apenas para estados de UI complexos.
