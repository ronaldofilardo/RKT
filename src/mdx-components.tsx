import type { ComponentType, ReactNode } from 'react';

/** Props aceitas pelos elementos mapeados do MDX (Central de Ajuda). */
interface MdxProps {
  children?: ReactNode;
  href?: string;
}

type MdxComponents = Record<string, ComponentType<MdxProps>>;

const mdxElements: MdxComponents = {
  h1: ({ children }) => <h1 className="text-2xl font-bold mt-2 mb-4">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-semibold mt-6 mb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2">{children}</h3>,
  p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
  a: ({ href, children }) => (
    <a href={href} className="text-telemetry-blue hover:text-telemetry-blue-light hover:underline">
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  code: ({ children }) => <code className="font-mono text-[0.9em]">{children}</code>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-telemetry-border/40 pl-4 mb-4 italic text-telemetry-text-muted">
      {children}
    </blockquote>
  ),
};

/** Fornece os componentes padrão do MDX (resolvido via providerImportSource do @next/mdx). */
export function useMDXComponents(existing: MdxComponents = {}): MdxComponents {
  return { ...mdxElements, ...existing };
}
