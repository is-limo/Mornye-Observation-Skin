import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';
import { injectMornyeSkin } from '../index.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const script = readFileSync(resolve(root, 'index.js'), 'utf8');
const css = readFileSync(resolve(root, 'styles', 'mornye.css'), 'utf8');

const requiredRuntimeHooks = [
  'mornye-connection-state',
  'mornye-run-state',
  'mornye-turn-count',
  'mornye-turn-elapsed',
  'mornye-cache-hit',
  'mornye-activity-list',
  'mornye-recent-count',
  'mornye-history-search',
  'mornye-dialog-query',
  'mornye-search-results',
  'mornye-loaded-count',
  'mornye-stat-steps',
  'mornye-stat-tool-time',
  'mornye-appearance-hide',
];

for (const hook of requiredRuntimeHooks) {
  assert.ok(script.includes(hook), `missing live UI hook: ${hook}`);
}

assert.match(
  script,
  /const defaults = \{[^}]*hidden: true \}/,
  'appearance must be hidden by default',
);
assert.match(script, /mornye\.appearance\.v2/, 'appearance storage must use the v2 key');
assert.match(script, /legacyStorageKey/, 'saved v1 appearance choices must be migrated');
assert.match(script, /localStorage/, 'appearance settings must use local storage');
assert.match(css, /data-mornye-panel-hidden/, 'hidden panel must restore the conversation width');
assert.match(script, /chatAnchorKey/, 'messages must use the native DSH row identity when available');
assert.match(script, /scrollIntoView/, 'navigator controls must locate their source rows');
assert.match(
  script,
  /mornyeConversationFocus/,
  'located messages must receive a temporary focus marker',
);
assert.match(
  css,
  /data-mornye-conversation-focus="true"/,
  'located messages must have a visible focus treatment',
);
assert.match(
  script,
  /\['user', 'steering', 'assistant-step'\]\.includes\(kind\)/,
  'the navigator must index only visible user and assistant message kinds',
);
assert.match(
  script,
  /firstByModuleClass\('AssistantMarkdown', 'body', row\)/,
  'assistant summaries must read the visible markdown body',
);
assert.match(
  script,
  /moduleClass\('ReasoningRow', 'root'\)/,
  'assistant summaries must exclude Think / Reasoning content',
);
assert.match(script, /summarizeMessage/, 'visible messages must receive local summaries');
assert.match(script, /conversationEntries\.slice\(-3\)/, 'the main navigator must show three recent messages');
assert.match(
  script,
  /conversationEntries\.filter\(\(entry\) => !recentKeys\.has\(entry\.key\)\)/,
  'an empty search dropdown must expose messages older than the recent three',
);
assert.match(script, /toLocaleLowerCase\(\)\.includes\(query\)/, 'loaded messages must be searchable');
assert.match(script, /runtime\.searchResults/, 'search results must render in the dropdown');
assert.doesNotMatch(
  script,
  /localStorage\.setItem\([^,]*(?:message|conversation)/i,
  'message summaries and the search index must not be persisted',
);
assert.doesNotMatch(
  script,
  /className = 'mornye-observation__activity'/,
  'the obsolete tool activity renderer must be removed',
);
assert.match(
  script,
  /mornye-observation__scan/,
  'the main observation arc must include a dedicated scan path',
);
assert.match(
  script,
  /mornye-observation__wave/,
  'the main observation stage must include the restrained telemetry wave',
);
assert.match(
  css,
  /data-mornye-motion="subtle"[^}]*data-mornye-session-state="running"[^}]*data-mornye-session-state="tool"[^}]*mornye-observation__scan/s,
  'the main arc scan must run only for active session states',
);
assert.match(
  css,
  /data-mornye-session-state="tool"[^}]*mornye-observation__scan[^}]*mornye-observation__wave/s,
  'tool activity must switch both motion signals to the gold state',
);
assert.doesNotMatch(
  css,
  /data-mornye-session-state="tool"\] \.mornye-observation__track/,
  'the tool-state base track must remain blue so the gold scan stays legible',
);
assert.match(
  css,
  /:not\(\[data-mornye-connection="offline"\]\)[^{]*mornye-observation__scan/s,
  'offline mode must suppress the main arc scan',
);
assert.match(
  css,
  /prefers-reduced-motion:[^)]+\)[\s\S]*mornye-observation__scan[\s\S]*animation: none !important/,
  'the main arc scan must respect reduced-motion preferences',
);
assert.doesNotMatch(
  script,
  /mornye-avatar-dock__orbit-signal/,
  'the small identity card orbit must remain decorative and static',
);

for (const demoValue of [
  'TRACK 03',
  'T+00:42',
  'AZIMUTH',
  'SIGNAL COHERENCE',
  'TRAJECTORY STABLE',
]) {
  assert.ok(!script.includes(demoValue), `demo-only value remains: ${demoValue}`);
}

const appearanceRule = css.match(/\.mornye-appearance\s*\{[^}]*\}/s)?.[0] ?? '';
assert.doesNotMatch(
  appearanceRule,
  /(?:^|[;\s])opacity\s*:/,
  'panel opacity must not fade its text and controls',
);

const injected = injectMornyeSkin('<!doctype html><html><head></head><body></body></html>');
assert.match(
  injected,
  /id="mornye-appearance-panel"[^>]*data-open="false"/,
  'appearance markup must start closed before local settings load',
);
assert.match(
  injected,
  /id="mornye-appearance-toggle"[^>]*aria-expanded="false"/,
  'appearance toggle must start collapsed',
);
const clientMatch = injected.match(/<script id="mornye-layout-client">([\s\S]*?)<\/script>/);
assert.ok(clientMatch, 'injected client runtime is missing');
assert.doesNotThrow(() => new vm.Script(clientMatch[1]), 'injected client runtime must compile');
assert.equal(
  injectMornyeSkin(injected),
  injected,
  'skin injection must remain idempotent',
);

console.log('mornye semantic contract: PASS');
