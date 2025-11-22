import { describe, it, expect } from 'vitest';
import type { VimState } from '@/core/types';
import { runSimKeys } from '@/core/testUtils/runSim';
import { runInNeovim, NeovimNotAvailableError } from '@/core/testUtils/runInNeovim';

type FeatureId =
  | 'motion_basic'
  | 'motion_word'
  | 'motion_line'
  | 'operator_delete'
  | 'operator_change'
  | 'insert_basic'
  | 'undo_redo';

type FeatureConfig = { enabled: Set<FeatureId> };

type MotionKey = 'h' | 'l' | 'w' | 'b' | '0' | '$';
type CommandKind =
  | { kind: 'motion'; motion: MotionKey }
  | { kind: 'deleteMotion'; motion: MotionKey }
  | { kind: 'changeMotion'; motion: MotionKey; text: string }
  | { kind: 'insertSnippet'; variant: 'i' | 'a'; text: string }
  | { kind: 'undo' }
  | { kind: 'redo' };

type Scenario = { name: string; lines: string[]; cursor: { line: number; col: number } };
type GeneratedCase = Scenario & { keySeq: string; label: string };

const ENABLED_FEATURES: FeatureConfig = {
  enabled: new Set<FeatureId>([
    'motion_basic',
    'motion_word',
    'motion_line',
    'operator_delete',
    'operator_change',
    'insert_basic',
    'undo_redo'
  ])
};

const SCENARIOS: Scenario[] = [
  { name: 'sentence', lines: ['foo bar baz'], cursor: { line: 1, col: 1 } },
  { name: 'punctuation', lines: ['foo,bar baz', 'second line'], cursor: { line: 1, col: 1 } }
];

const toKeySeq = (cmd: CommandKind): string => {
  switch (cmd.kind) {
    case 'motion':
      return cmd.motion;
    case 'deleteMotion':
      return `d${cmd.motion}`;
    case 'changeMotion':
      return `c${cmd.motion}${cmd.text}<Esc>`;
    case 'insertSnippet':
      return `${cmd.variant}${cmd.text}<Esc>`;
    case 'undo':
      return 'u';
    case 'redo':
      return '<C-r>';
    default:
      return '';
  }
};

const buildCommands = (cfg: FeatureConfig): CommandKind[] => {
  const cmds: CommandKind[] = [];
  const motions: MotionKey[] = [];
  if (cfg.enabled.has('motion_basic')) motions.push('h', 'l');
  if (cfg.enabled.has('motion_word')) motions.push('w', 'b');
  if (cfg.enabled.has('motion_line')) motions.push('0', '$');

  motions.forEach(motion => cmds.push({ kind: 'motion', motion }));

  if (cfg.enabled.has('operator_delete')) {
    motions
      .filter(motion => motion === 'w' || motion === '$')
      .forEach(motion => cmds.push({ kind: 'deleteMotion', motion }));
  }
  if (cfg.enabled.has('operator_change')) {
    motions
      .filter(motion => motion === '$')
      .forEach(motion => cmds.push({ kind: 'changeMotion', motion, text: 'z' }));
  }

  if (cfg.enabled.has('insert_basic')) {
    cmds.push({ kind: 'insertSnippet', variant: 'i', text: 'abc' });
    cmds.push({ kind: 'insertSnippet', variant: 'a', text: 'XYZ' });
  }

  return cmds;
};

const generateSequences = (
  commands: CommandKind[],
  opts: { sampleLen2: number }
): { seq: CommandKind[]; label: string }[] => {
  const unique = new Set<string>();
  const store = (seq: CommandKind[], label: string) => {
    const key = seq.map(toKeySeq).join('');
    if (!unique.has(key)) {
      unique.add(key);
      result.push({ seq, label });
    }
  };

  const result: { seq: CommandKind[]; label: string }[] = [];

  commands.forEach(cmd => store([cmd], 'len1'));

  let len2Count = 0;
  for (const a of commands) {
    for (const b of commands) {
      if (len2Count >= opts.sampleLen2) break;
      store([a, b], 'len2');
      len2Count += 1;
    }
    if (len2Count >= opts.sampleLen2) break;
  }

  return result;
};

const buildCases = (cfg: FeatureConfig): GeneratedCase[] => {
  const commands = buildCommands(cfg);
  const sequences = generateSequences(commands, { sampleLen2: 120 });

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
