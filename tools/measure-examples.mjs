// Reproducible source-length comparison for the public example.
// No compiler is available yet; this measures authored view text only.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = {
  'Original JSX': 'examples/profile-editor.original.tsx.txt',
  'Axe': 'examples/profile-editor.axe',
};

function viewSource(relativePath) {
  const source = readFileSync(resolve(root, relativePath), 'utf8');
  const start = source.indexOf('return (');
  const finish = source.lastIndexOf('\n);');
  if (start < 0 || finish < start) {
    throw new Error('Expected view return block not found: ' + relativePath);
  }
  return source.slice(start, finish + 3);
}

const count = source => ({
  lines: source.split('\n').length,
  chars: source.length,
  noWhitespace: source.replace(/\s/g, '').length,
});

const original = count(viewSource(files['Original JSX']));
const axe = count(viewSource(files.Axe));
const difference = Object.fromEntries(
  Object.keys(original).map(key => [key, {
    saved: original[key] - axe[key],
    percent: Number(((original[key] - axe[key]) / original[key] * 100).toFixed(1)),
  }]),
);

console.log(JSON.stringify({ original, axe, difference }, null, 2));
