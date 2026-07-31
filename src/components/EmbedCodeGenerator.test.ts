import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./EmbedCodeGenerator.tsx', import.meta.url), 'utf8');

test('React export snippet contains expanded repository showcase sections', () => {
  assert.match(source, /export function GitHubRepoCard\(\{ renderWebArchitecture \} = \{}\)/);
  assert.match(source, /Architecture Diagrams/);
  assert.match(source, /Language Composition &amp; Tech Stack/);
  assert.match(source, /Repository Structure \(\{data\.repo\.defaultBranch\}\)/);
});

test('React export snippet surfaces available diagram modes and hooks', () => {
  assert.match(source, /\['mermaid', 'Mermaid'\]/);
  assert.match(source, /\['web', 'Interactive Web'\]/);
  assert.match(source, /\['plantuml', 'PlantUML'\]/);
  assert.match(source, /\['specs', 'Class Inventory'\]/);
  assert.match(source, /renderWebArchitecture\(\{/);
});
