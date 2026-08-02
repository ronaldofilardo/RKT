const { execSync } = require('child_process');
const fs = require('fs');

function getStagedFiles() {
  try {
    const out = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return out.split('\n').filter(Boolean);
  } catch (e) {
    console.error('Failed to get staged files');
    process.exit(1);
  }
}

function extractPathsFromFile(path) {
  try {
    const content = fs.readFileSync(path, 'utf8');
    // simple heuristic: lines that look like a file path ending with .ts or .tsx or .js
    const matches = content.match(/[\w\/.\\-]+\.(ts|tsx|js)/g) || [];
    return matches;
  } catch (_) {
    return [];
  }
}

const staged = getStagedFiles();
const refPaths = new Set([
  ...extractPathsFromFile('docs/REFACTOR_QUEUE.md'),
  ...extractPathsFromFile('docs/TECH_DEBT.md')
]);

const touchesRef = staged.some(f => refPaths.has(f));
if (touchesRef) {
  const hasCharTest = staged.some(f => f.endsWith('.characterization.test.ts'));
  if (!hasCharTest) {
    console.error('Error: Changes to files listed in REFACTOR_QUEUE.md or TECH_DEBT.md require a .characterization.test.ts file in the same commit.');
    process.exit(1);
  }
}
process.exit(0);
