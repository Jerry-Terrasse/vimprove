// Debug helper to compare sim state vs Neovim for a given case label
const path = require('path');
const Module = require('module');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    const resolved = path.join(__dirname, '..', 'src', request.slice(2));
    return originalResolve.call(this, resolved, parent, isMain, options);
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

const { getShardCases, DEFAULT_INIT } = require('../src/core/tests/exhaustiveTestCases');
const { runSimKeys } = require('../src/core/testUtils/runSim');
const { runInNeovim, NeovimNotAvailableError } = require('../src/core/testUtils/runInNeovim');
const { INITIAL_VIM_STATE, vimReducer } = require('../src/core/vimReducer');

const KEY_TOKEN_MAP = {
  '<Esc>': { key: 'Escape' },
  '<Enter>': { key: 'Enter' },
  '<CR>': { key: 'Enter' },
  '<BS>': { key: 'Backspace' },
  '<Tab>': { key: 'Tab' },
  '<Space>': { key: ' ' },
  '<C-r>': { key: 'r', ctrlKey: true },
  '<C-R>': { key: 'r', ctrlKey: true },
};

const parseKeySequence = keySeq => {
  const keys = [];
  for (let i = 0; i < keySeq.length; i++) {
    const char = keySeq[i];
    if (char === '<') {
      const end = keySeq.indexOf('>', i);
      if (end !== -1) {
        const token = keySeq.slice(i, end + 1);
        keys.push(KEY_TOKEN_MAP[token] ?? { key: token.slice(1, -1) });
        i = end;
        continue;
      }
    }
    keys.push({ key: char });
  }
  return keys;
};

const label = process.argv[2];
const shard = Number(process.argv[3] ?? 0);
const trace = process.argv.includes('--trace');
const steps = process.argv.includes('--steps');
if (!label) {
  console.error('usage: node -r sucrase/register tmp/vimprove-debug.cjs <label> [shard]');
  process.exit(1);
}
const cases = getShardCases(shard, 8);
const target = cases.find(c => c.label === label);
if (!target) {
  console.error('case not found');
  process.exit(1);
}
let real;
try {
  real = runInNeovim(target.lines, target.cursor, target.keySeq);
} catch (err) {
  if (err instanceof NeovimNotAvailableError) {
    console.log('Neovim not available');
    process.exit(0);
  }
  throw err;
}
const sim = runSimKeys({
  ...DEFAULT_INIT,
  buffer: target.lines,
  cursor: { line: target.cursor.line - 1, col: target.cursor.col - 1 }
}, target.keySeq);
console.log(JSON.stringify({
  keySeq: target.keySeq,
  realLines: real.lines,
  simLines: sim.buffer,
  realCursor: real.cursor,
  simCursor: { line: sim.cursor.line + 1, col: sim.cursor.col + 1 },
  realMode: real.mode,
  simMode: sim.mode
}, null, 2));

if (trace) {
  const parsed = parseKeySequence(target.keySeq);
  let state = { ...INITIAL_VIM_STATE, ...DEFAULT_INIT, buffer: target.lines, cursor: { line: target.cursor.line - 1, col: target.cursor.col - 1 } };
  state.history = [];
  state.historyIndex = -1;
  console.log('--- trace ---');
  parsed.forEach((k, idx) => {
    state = vimReducer(state, { type: 'KEYDOWN', payload: { key: k.key, ctrlKey: k.ctrlKey ?? false } });
    console.log(idx, k, {
      cursor: { line: state.cursor.line + 1, col: state.cursor.col + 1 },
      mode: state.mode,
      count: state.count,
      pendingOp: state.pendingOperator,
      pendingText: state.pendingTextObject,
      lastChangeCount: state.lastChangeCount,
      line: state.buffer[0]
    });
  });
}

if (steps) {
  console.log('--- steps ---');
  for (let i = 1; i <= target.keySeq.length; i++) {
    const prefix = target.keySeq.slice(0, i);
    const realStep = runInNeovim(target.lines, target.cursor, prefix);
    const simStep = runSimKeys({
      ...DEFAULT_INIT,
      buffer: target.lines,
      cursor: { line: target.cursor.line - 1, col: target.cursor.col - 1 }
    }, prefix);

    console.log(JSON.stringify({
      keys: prefix,
      realCursor: realStep.cursor,
      simCursor: { line: simStep.cursor.line + 1, col: simStep.cursor.col + 1 },
      realMode: realStep.mode,
      simMode: simStep.mode
    }));
  }
}
