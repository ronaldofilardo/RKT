#!/usr/bin/env node
const { execSync, spawnSync } = require('child_process');
const path = require('path');

// Set test env
process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env.test' });

function getChangedFiles() {
  try {
    // Compare against main branch (assumes origin/main is up‑to‑date)
    const out = execSync('git diff --name-only origin/main...HEAD', { encoding: 'utf8' });
    return out.split('\n').filter(Boolean);
  } catch (e) {
    console.error('Failed to determine changed files');
    process.exit(1);
  }
}

const files = getChangedFiles();
if (files.length === 0) {
  console.log('No changed files detected – skipping mutation testing.');
  process.exit(0);
}

const mutateArg = files.map(f => `"${f}"`).join(' ');
console.log('Running mutation testing on changed files:', files);

// Use pnpm exec to run stryker with the mutate list
const result = spawnSync('pnpm', ['exec', 'stryker', 'run', '--mutate', ...files], { stdio: 'inherit' });
process.exit(result.status);
