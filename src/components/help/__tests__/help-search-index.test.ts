import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Teste de frescor do índice de busca da Central de Ajuda (Fatia 3).
 * Garante que `content/help/search-index.json` (gerado por `pnpm help:index`)
 * cobre exatamente os artigos .mdx versionados — sem faltantes e sem órfãos.
 */

interface IndexEntry {
  url: string;
  title: string;
  perfil: string;
  text: string;
}

const ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'help');

interface MdxFile {
  full: string;
  segments: string[];
}

function collectMdx(dir: string, segments: string[]): MdxFile[] {
  const found: MdxFile[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...collectMdx(full, [...segments, entry.name]));
    } else if (entry.name.endsWith('.mdx')) {
      found.push({ full, segments: [...segments, entry.name.replace(/\.mdx$/, '')] });
    }
  }
  return found;
}

/** Espelha a regra de URL de scripts/generate-help-search-index.mjs. */
function urlFor(segments: string[]): string {
  const [first, ...rest] = segments;
  return first === 'referencia' ? `/help/${rest.join('/')}` : `/help/${segments.join('/')}`;
}

const index = JSON.parse(
  readFileSync(path.join(CONTENT_DIR, 'search-index.json'), 'utf8'),
) as { articles: IndexEntry[] };
const mdxFiles = collectMdx(CONTENT_DIR, []);

describe('índice de busca da Central de Ajuda (frescor)', () => {
  it('indexa todos os artigos .mdx versionados no repositório', () => {
    const indexed = new Set(index.articles.map((article) => article.url));
    const missing = mdxFiles.map((file) => urlFor(file.segments)).filter((url) => !indexed.has(url));
    expect(missing).toEqual([]);
    expect(mdxFiles.length).toBeGreaterThanOrEqual(20);
  });

  it('não mantém entradas órfãs de artigos removidos do repositório', () => {
    const existing = new Set(mdxFiles.map((file) => urlFor(file.segments)));
    const stale = index.articles.map((article) => article.url).filter((url) => !existing.has(url));
    expect(stale).toEqual([]);
  });

  it('cada entrada tem título, perfil e texto úteis para a busca', () => {
    expect(index.articles.length).toBe(mdxFiles.length);
    for (const article of index.articles) {
      expect(article.url.startsWith('/help/')).toBe(true);
      expect(article.title.length).toBeGreaterThan(2);
      expect(article.perfil.length).toBeGreaterThan(0);
      expect(article.text.length).toBeGreaterThan(80);
    }
  });
});
