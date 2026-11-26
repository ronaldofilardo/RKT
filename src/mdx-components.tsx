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
  table: ({ children }) => (
    <div className="overflow-x-auto my-6 rounded-lg border border-telemetry-border/30">
      <table className="w-full text-left border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-telemetry-surface/60 border-b border-telemetry-border/30 text-telemetry-text-muted">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-telemetry-border/10">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-telemetry-surface/20 transition-colors">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="py-2.5 px-3.5 font-semibold text-telemetry-text">{children}</th>
  ),
  td: ({ children }) => (
    <td className="py-2.5 px-3.5 text-telemetry-text/90 align-top">{children}</td>
  ),
};

/** Fornece os componentes padrão do MDX (resolvido via providerImportSource do @next/mdx). */
export function useMDXComponents(existing: MdxComponents = {}): MdxComponents {
  return { ...mdxElements, ...existing };
}
