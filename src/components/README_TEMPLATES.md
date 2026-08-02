# Templates de Frontend — rkt

**Owner:** @frontend  
**Status:** Oficial (Onda 1 — Guardrails)

---

## Como Usar

Estes templates são **referências** para novos componentes e páginas. **NÃO use diretamente** — copie e adapte.

---

## Componente Template

**Arquivo:** `src/components/[ComponentName]/[ComponentName].tsx`

```tsx
'use client';

import React from 'react';
import { cn } from '@/lib/ui-helpers';

export interface [ComponentName]Props {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function [ComponentName]({
  children,
  className,
  disabled = false,
  onClick,
  variant = 'primary',
  size = 'md',
}: [ComponentName]Props) {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const classes = cn(
    'inline-flex items-center justify-center font-body',
    'transition-all duration-motion-base ease-standard',
    variant === 'primary' && 'bg-accent text-white hover:bg-accent-hover',
    variant === 'secondary' && 'bg-bg-2 text-fg hover:bg-bg-3',
    variant === 'outline' && 'border border-border text-fg hover:bg-bg-2',
    size === 'sm' && 'text-airtable-sm px-space-3 py-space-2 radius-sm',
    size === 'md' && 'text-airtable-base px-space-4 py-space-3 radius-md',
    size === 'lg' && 'text-airtable-lg px-space-6 py-space-4 radius-lg',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    className
  );

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={handleClick}
      aria-disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}

[ComponentName].displayName = '[ComponentName]';
```

---

## Página Template (Next.js App Router)

**Arquivo:** `src/app/[resource]/page.tsx`

```tsx
import { Metadata } from 'next';
import { [Resource]List } from '@/components/[resource]/[resource]-list';

export const metadata: Metadata = {
  title: '[Resource] | rkt',
  description: 'Lista de [resource] do sistema',
};

interface [Resource]PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    sort?: string;
  }>;
}

export default async function [Resource]Page({ searchParams }: [Resource]PageProps) {
  const { page = '1', limit = '20', sort = 'createdAt' } = await searchParams;

  // Fetch de dados (Server Component)
  // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/[resource]?page=${page}`, {
  //   next: { revalidate: 60 },
  // });
  // const { data } = await response.json();

  return (
    <div className="flex flex-col gap-space-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-airtable-2xl font-display font-bold text-fg">
            [Resource]
          </h1>
          <p className="text-airtable-sm text-fg-muted mt-space-2">
            Gerencie seus [resource] aqui
          </p>
        </div>
      </header>

      <section>
        {/* Lista de [resource] */}
        <[Resource]List items={[]} />
      </section>
    </div>
  );
}
```

---

## Checklist de Review de Componentes

Antes de merge:

- [ ] **Server Component por padrão** — "use client" só se necessário
- [ ] **Props tipadas** — interface com TypeScript
- [ ] **Classes com cn()** — tailwind-merge + clsx
- [ ] **Design tokens** — cores, spacing, typography do tailwind.config.ts
- [ ] **Acessibilidade** — ARIA, keyboard navigation
- [ ] **Responsivo** — mobile-first (sm:, md:, lg:)
- [ ] **Tratamento de erro** — loading + error states
- [ ] **Testes** — componente + interações

---

## Referências

- `src/lib/ui-helpers.ts` — Utilitários de UI (cn, formatDate, etc.)
- `tailwind.config.ts` — Design tokens
- `src/lib/design-system.ts` — Documentação do design system
- `AGENTS.md` — Regra de fronteira (código novo segue guardrails)