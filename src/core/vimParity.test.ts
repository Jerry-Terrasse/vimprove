import { describe, it, expect } from 'vitest';
import type { VimState } from '@/core/types';
import { runSimKeys } from '@/core/testUtils/runSim';
import { runInNeovim, NeovimNotAvailableError } from '@/core/testUtils/runInNeovim';

type FeatureId =
  | 'motion_hjkl'
  | 'motion_word'
  | 'motion_0$'
  | 'operator_delete'
  | 'operator_change'
  | 'insert_basic'
  | 'undo_redo';

type FeatureConfig = { enabled: Set<FeatureId> };

type Case = {
  name: string;
  initLines: string[];
  cursor: { line: number; col: number };
  keySeq: string;
  requires: FeatureId[];
};

const enabledFeatures: FeatureConfig = {
  enabled: new Set<FeatureId>([
    'motion_hjkl',
    'motion_word',
    'motion_0$',
    'operator_delete',
    'operator_change',
    'insert_basic',
    'undo_redo'
  ])
};

const filterCases = (cases: Case[], cfg: FeatureConfig) =>
  cases.filter(c => c.requires.every(f => cfg.enabled.has(f)));

const MANUAL_CASES: Case[] = [
  {
    name: 'dw deletes word and stays at start',
    initLines: ['foo bar'],
    cursor: { line: 1, col: 1 },
    keySeq: 'dw',
    requires: ['motion_word', 'operator_delete']
  },
  {
    name: 'd$ deletes to end and cursor backs up',
    initLines: ['hello world'],
    cursor: { line: 1, col: 7 },
    keySeq: 'd$',
    requires: ['motion_0$', 'operator_delete']
  },
  {
    name: 'c$ enters insert after trimming to end',
    initLines: ['hello world'],
    cursor: { line: 1, col: 7 },
    keySeq: 'c$abc<Esc>',
    requires: ['motion_0$', 'operator_change', 'insert_basic']
  },
  {
    name: 'undo redo after delete',
    initLines: ['one two'],
    cursor: { line: 1, col: 5 },
    keySeq: 'dwudw',
    requires: ['motion_word', 'operator_delete', 'undo_redo']
  },
  {
    name: 'insert text and escape',
    initLines: ['abc'],
    cursor: { line: 1, col: 2 },
    keySeq: 'iXYZ<Esc>',
    requires: ['insert_basic']
  },
  {
    name: '0 motion to start',
    initLines: ['hello'],
    cursor: { line: 1, col: 5 },
    keySeq: '0',
    requires: ['motion_0$']
  },
  {
    name: 'w motion across punctuation',
    initLines: ['foo,bar baz'],
    cursor: { line: 1, col: 1 },
    keySeq: 'w',
    requires: ['motion_word']
  }
];

const DEFAULT_INIT: Pick<VimState, 'buffer' | 'cursor' | 'mode'> = {
  buffer: ['foo bar baz', 'hello world'],
  cursor: { line: 0, col: 0 },
  mode: 'normal'
};

const CASES = filterCases(MANUAL_CASES, enabledFeatures);

describe('Vim emulator matches Neovim (feature-gated)', () => {
  it.each(CASES)('$name', async testCase => {
    let realState;
    try {
      realState = runInNeovim(testCase.initLines, testCase.cursor, testCase.keySeq);
    } catch (err) {
      if (err instanceof NeovimNotAvailableError) {
        console.warn('Neovim not available, skipping parity tests.');
        return;
      }
      throw err;
    }

    const simState = runSimKeys(
      {
        ...DEFAULT_INIT,
        buffer: testCase.initLines,
        cursor: { line: testCase.cursor.line - 1, col: testCase.cursor.col - 1 }
      },
      testCase.keySeq
    );

    expect(simState.buffer).toEqual(realState.lines);
    expect({ line: simState.cursor.line + 1, col: simState.cursor.col + 1 }).toEqual(realState.cursor);
    expect(simState.mode.charAt(0)).toBe(realState.mode.charAt(0));
  });
});
