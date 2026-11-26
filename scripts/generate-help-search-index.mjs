/**
 * Gera content/help/search-index.json — índice de busca full-text da Central de Ajuda
 * (Fatia 3, Fuse.js). Roda antes do build (`pnpm help:index`) e o frescor do índice
 * é coberto por src/components/help/__tests__/help-search-index.test.ts.
 *
 * Regras de URL (espelham as rotas da app):
 *   content/help/<perfil>/<slug>.mdx  -> /help/<perfil>/<slug>
 *   content/help/referencia/<slug>.mdx -> /help/<slug>
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'help');
const OUTPUT_FILE = path.join(CONTENT_DIR, 'search-index.json');

function collectMdx(dir, segments) {
  const found = [];
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

function urlFor(segments) {
  const [first, ...rest] = segments;
  return first === 'referencia' ? `/help/${rest.join('/')}` : `/help/${segments.join('/')}`;
}

function titleOf(raw) {
  const match = raw.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : '';
}

/** Remove a marcação Markdown mantendo apenas o texto pesquisável. */
function stripMarkdown(raw) {
  return raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\|?[\s|:-]+\|?$/gm, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/[|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const articles = collectMdx(CONTENT_DIR, [])
  .map(({ full, segments }) => {
    const raw = readFileSync(full, 'utf8');
    return {
      url: urlFor(segments),
      title: titleOf(raw),
      perfil: segments[0] ?? '',
      text: stripMarkdown(raw),
    };
  })
  .filter((article) => article.title)
  .sort((a, b) => a.url.localeCompare(b.url));

writeFileSync(OUTPUT_FILE, `${JSON.stringify({ articles }, null, 2)}\n`, 'utf8');
console.log(`[help:index] ${articles.length} artigos indexados -> ${path.relative(ROOT, OUTPUT_FILE)}`);
