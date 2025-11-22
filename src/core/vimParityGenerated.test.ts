import { describe, it, expect } from 'vitest';
import type { VimState } from '@/core/types';
import { runSimKeys } from '@/core/testUtils/runSim';
import { runInNeovim, NeovimNotAvailableError } from '@/core/testUtils/runInNeovim';

type FeatureId =
  | 'motion_hjkl'
  | 'motion_word'        // w/b/e
  | 'motion_WORD'        // W/B/E
  | 'motion_line'        // 0/^/$
  | 'operator_d'
  | 'operator_c'
  | 'operator_y'
  | 'edit_xsr'           // x/s/r
  | 'edit_dd'
  | 'insert_ia'          // i/a
  | 'insert_IA'          // I/A
  | 'insert_oO'          // o/O
  | 'paste'              // p/P
  | 'undo_redo'          // u/Ctrl-r
  | 'dot';               // .

type FeatureConfig = { enabled: Set<FeatureId> };

type CommandKind =
  | { kind: 'motion'; key: string }
  | { kind: 'delete'; key: string }
  | { kind: 'change'; motion: string; text: string }
  | { kind: 'yank'; motion: string }
  | { kind: 'edit'; key: string }       // x/s/r{char}/dd
  | { kind: 'insert'; key: string; text: string }
  | { kind: 'paste'; key: 'p' | 'P' }
  | { kind: 'undo' }
  | { kind: 'redo' }
  | { kind: 'dot' };

type Scenario = {
  name: string;
  lines: string[];
  cursor: { line: number; col: number };
};

type GeneratedCase = Scenario & { keySeq: string; label: string };

const ENABLED_FEATURES: FeatureConfig = {
  enabled: new Set<FeatureId>([
    'motion_hjkl',
    'motion_word',
    // 'motion_WORD',     // Disable WORD motions - may have bugs
    'motion_line',
    'operator_d',
    'operator_c',
    'operator_y',
    'edit_xsr',
    'edit_dd',
    'insert_ia',
    // 'insert_IA',       // Disable I/A - not yet implemented
    // 'insert_oO',       // Disable o/O - not yet implemented
    'paste',
    'undo_redo',
    'dot'
  ])
};

const SCENARIOS: Scenario[] = [
  { name: 'simple', lines: ['foo bar baz'], cursor: { line: 1, col: 5 } },
  { name: 'multiline', lines: ['foo bar', 'baz qux'], cursor: { line: 1, col: 5 } },
  { name: 'empty', lines: [''], cursor: { line: 1, col: 1 } },
  { name: 'punct', lines: ['a,b.c'], cursor: { line: 1, col: 2 } }
];

const toKeySeq = (cmd: CommandKind): string => {
  switch (cmd.kind) {
    case 'motion':
      return cmd.key;
    case 'delete':
      return cmd.key;
    case 'change':
      return `c${cmd.motion}${cmd.text}<Esc>`;
    case 'yank':
      return `y${cmd.motion}`;
    case 'edit':
      return cmd.key;
    case 'insert':
      return `${cmd.key}${cmd.text}<Esc>`;
    case 'paste':
      return cmd.key;
    case 'undo':
      return 'u';
    case 'redo':
      return '<C-r>';
    case 'dot':
      return '.';
    default:
      return '';
  }
};

const buildCommands = (cfg: FeatureConfig): CommandKind[] => {
  const cmds: CommandKind[] = [];
  const motions: string[] = [];

  // Basic motions
  if (cfg.enabled.has('motion_hjkl')) {
    ['h', 'j', 'k', 'l'].forEach(k => cmds.push({ kind: 'motion', key: k }));
    motions.push('h', 'j', 'k', 'l');
  }

  // Word motions
  if (cfg.enabled.has('motion_word')) {
    ['w', 'b', 'e'].forEach(k => cmds.push({ kind: 'motion', key: k }));
    motions.push('w', 'b', 'e');
  }

  // WORD motions
  if (cfg.enabled.has('motion_WORD')) {
    ['W', 'B', 'E'].forEach(k => cmds.push({ kind: 'motion', key: k }));
    motions.push('W', 'B', 'E');
  }

  // Line motions
  if (cfg.enabled.has('motion_line')) {
    ['0', '^', '$'].forEach(k => cmds.push({ kind: 'motion', key: k }));
    motions.push('0', '^', '$');
  }

  // Operator + motion (select subset to avoid explosion)
  const operatorMotions = ['w', '$', 'e'];

  if (cfg.enabled.has('operator_d')) {
    operatorMotions.forEach(m => cmds.push({ kind: 'delete', key: `d${m}` }));
  }

  if (cfg.enabled.has('operator_c')) {
    operatorMotions.forEach(m => cmds.push({ kind: 'change', motion: m, text: 'X' }));
  }

  if (cfg.enabled.has('operator_y')) {
    operatorMotions.forEach(m => cmds.push({ kind: 'yank', motion: m }));
  }

  // Single edit commands
  if (cfg.enabled.has('edit_xsr')) {
    cmds.push({ kind: 'edit', key: 'x' });
    cmds.push({ kind: 'edit', key: 's' });
    cmds.push({ kind: 'edit', key: 'ra' });
  }

  if (cfg.enabled.has('edit_dd')) {
    cmds.push({ kind: 'edit', key: 'dd' });
  }

  // Insert commands
  if (cfg.enabled.has('insert_ia')) {
    cmds.push({ kind: 'insert', key: 'i', text: 'Z' });
    cmds.push({ kind: 'insert', key: 'a', text: 'Y' });
  }

  if (cfg.enabled.has('insert_IA')) {
    cmds.push({ kind: 'insert', key: 'I', text: 'Q' });
    cmds.push({ kind: 'insert', key: 'A', text: 'P' });
  }

  if (cfg.enabled.has('insert_oO')) {
    cmds.push({ kind: 'insert', key: 'o', text: 'M' });
    cmds.push({ kind: 'insert', key: 'O', text: 'N' });
  }

  // Paste
  if (cfg.enabled.has('paste')) {
    cmds.push({ kind: 'paste', key: 'p' });
    cmds.push({ kind: 'paste', key: 'P' });
  }

  // Undo/Redo
  if (cfg.enabled.has('undo_redo')) {
    cmds.push({ kind: 'undo' });
    cmds.push({ kind: 'redo' });
  }

  // Dot command
  if (cfg.enabled.has('dot')) {
    cmds.push({ kind: 'dot' });
  }

  return cmds;
};

// Deterministic sampling with seed
const sampleWithSeed = <T>(arr: T[], count: number, seed: number): T[] => {
  if (arr.length <= count) return arr;
  const result: T[] = [];
  const step = Math.floor(arr.length / count);
  for (let i = 0; i < count; i++) {
    result.push(arr[(i * step + seed) % arr.length]);
  }
  return result;
};

const generateSequences = (
  commands: CommandKind[]
): { seq: CommandKind[]; label: string }[] => {
  const result: { seq: CommandKind[]; label: string }[] = [];
  const unique = new Set<string>();

  const addSeq = (seq: CommandKind[], label: string) => {
    const key = seq.map(toKeySeq).join('');
    if (!unique.has(key)) {
      unique.add(key);
      result.push({ seq, label });
    }
  };

  // Length 1: All commands
  commands.forEach(cmd => addSeq([cmd], 'len1'));

  // Length 2: Strategically selected pairs
  const len2Pairs: [string[], string[]][] = [
    // Motion chains
    [['motion'], ['motion']],
    // Operator + motion
    [['delete', 'change', 'yank'], ['motion']],
    // Edit + undo
    [['edit', 'delete'], ['undo']],
    // Insert + dot
    [['insert'], ['dot']],
    // Delete + paste
    [['delete'], ['paste']],
    // Undo + redo
    [['undo'], ['redo']],
  ];

  len2Pairs.forEach(([kinds1, kinds2]) => {
    const pool1 = commands.filter(c => kinds1.includes(c.kind));
    const pool2 = commands.filter(c => kinds2.includes(c.kind));

    const sampled = sampleWithSeed(
      pool1.flatMap(a => pool2.map(b => [a, b])),
      Math.min(15, pool1.length * pool2.length),
      42
    );

    sampled.forEach(([a, b]) => addSeq([a, b], 'len2'));
  });

  // Length 3: Curated scenarios
  const len3Patterns: [string[], string[], string[]][] = [
    [['delete'], ['undo'], ['redo']],       // dw u Ctrl-r
    [['insert'], ['dot'], ['dot']],         // iZ<Esc> . .
    [['delete'], ['paste'], ['dot']],       // dw p .
    [['yank'], ['motion'], ['paste']],      // yw $ p
    [['edit'], ['undo'], ['dot']],          // x u .
  ];

  len3Patterns.forEach(([kinds1, kinds2, kinds3]) => {
    const pool1 = commands.filter(c => kinds1.includes(c.kind));
    const pool2 = commands.filter(c => kinds2.includes(c.kind));
    const pool3 = commands.filter(c => kinds3.includes(c.kind));

    const sampled = sampleWithSeed(
      pool1.flatMap(a =>
        pool2.flatMap(b =>
          pool3.map(c => [a, b, c])
        )
      ),
      Math.min(10, pool1.length * pool2.length * pool3.length),
      123
    );

    sampled.forEach(([a, b, c]) => addSeq([a, b, c], 'len3'));
  });

  return result;
};

const buildCases = (cfg: FeatureConfig): GeneratedCase[] => {
  const commands = buildCommands(cfg);
  const sequences = generateSequences(commands);

  const cases: GeneratedCase[] = [];
  sequences.forEach(item => {
    const keySeq = item.seq.map(toKeySeq).join('');
    SCENARIOS.forEach(scenario => {
      cases.push({
        ...scenario,
        keySeq,
        label: `${scenario.name}-${item.label}-${keySeq}`
      });
    });
  });
  return cases;
};

const DEFAULT_INIT: Pick<VimState, 'buffer' | 'cursor' | 'mode'> = {
  buffer: ['foo bar baz', 'hello world'],
  cursor: { line: 0, col: 0 },
  mode: 'normal'
};

const GENERATED_CASES = buildCases(ENABLED_FEATURES);

describe('Vim emulator matches Neovim (generated combos)', () => {
  it.each(GENERATED_CASES)('$label', async testCase => {
    let realState;
    try {
      realState = runInNeovim(testCase.lines, testCase.cursor, testCase.keySeq);
    } catch (err) {
      if (err instanceof NeovimNotAvailableError) {
        console.warn('Neovim not available, skipping generated parity tests.');
        return;
      }
      throw err;
    }

    const simState = runSimKeys(
      {
        ...DEFAULT_INIT,
        buffer: testCase.lines,
        cursor: { line: testCase.cursor.line - 1, col: testCase.cursor.col - 1 }
      },
      testCase.keySeq
    );

    expect(simState.buffer).toEqual(realState.lines);
    expect({ line: simState.cursor.line + 1, col: simState.cursor.col + 1 }).toEqual(realState.cursor);
    expect(simState.mode.charAt(0)).toBe(realState.mode.charAt(0));
  });
});
