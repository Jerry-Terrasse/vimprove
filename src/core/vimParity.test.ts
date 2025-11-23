import { describe, it, expect } from 'vitest';
import type { VimState } from '@/core/types';
import { runSimKeys } from '@/core/testUtils/runSim';
import { runInNeovim, NeovimNotAvailableError } from '@/core/testUtils/runInNeovim';

type FeatureId =
  // Chapter 1: Modes and basic motions
  | 'motion_hjkl'
  | 'motion_0$^'
  | 'insert_basic'
  // Chapter 2: Word motions
  | 'motion_word'
  | 'motion_WORD'
  | 'edit_chars'
  // Chapter 3: Operators
  | 'operator_delete'
  | 'operator_change'
  | 'operator_yank'
  | 'paste'
  | 'undo_redo'
  | 'count_prefix'
  | 'dot_command'
  // Chapter 4: Find/till
  | 'find_char'
  | 'find_repeat'
  // Chapter 5: Text objects
  | 'textobj_word'
  | 'textobj_para'
  | 'textobj_bracket'
  | 'textobj_quote'
  // Chapter 6: Search
  | 'search_basic';

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
    // Chapter 1
    'motion_hjkl',
    'motion_0$^',
    'insert_basic',
    // Chapter 2
    'motion_word',
    'motion_WORD',
    'edit_chars',
    // Chapter 3
    'operator_delete',
    'operator_change',
    'operator_yank',
    'paste',
    'undo_redo',
    'count_prefix',
    'dot_command',
    // Chapter 4
    'find_char',
    'find_repeat',
    // Chapter 5
    'textobj_word',
    'textobj_para',
    'textobj_bracket',
    'textobj_quote',
    // Chapter 6
    'search_basic'
  ])
};

const filterCases = (cases: Case[], cfg: FeatureConfig) =>
  cases.filter(c => c.requires.every(f => cfg.enabled.has(f)));

const MANUAL_CASES: Case[] = [
  // ========== Chapter 1: Modes and Basic Motions ==========
  {
    name: 'Ch1: h moves left',
    initLines: ['hello'],
    cursor: { line: 1, col: 3 },
    keySeq: 'h',
    requires: ['motion_hjkl']
  },
  {
    name: 'Ch1: j moves down',
    initLines: ['foo', 'bar'],
    cursor: { line: 1, col: 1 },
    keySeq: 'j',
    requires: ['motion_hjkl']
  },
  {
    name: 'Ch1: k moves up',
    initLines: ['foo', 'bar'],
    cursor: { line: 2, col: 1 },
    keySeq: 'k',
    requires: ['motion_hjkl']
  },
  {
    name: 'Ch1: l moves right',
    initLines: ['hello'],
    cursor: { line: 1, col: 1 },
    keySeq: 'l',
    requires: ['motion_hjkl']
  },
  {
    name: 'Ch1: 0 jumps to column 0',
    initLines: ['hello world'],
    cursor: { line: 1, col: 7 },
    keySeq: '0',
    requires: ['motion_0$^']
  },
  {
    name: 'Ch1: ^ jumps to first non-blank',
    initLines: ['  hello'],
    cursor: { line: 1, col: 6 },
    keySeq: '^',
    requires: ['motion_0$^']
  },
  {
    name: 'Ch1: $ jumps to end of line',
    initLines: ['hello world'],
    cursor: { line: 1, col: 1 },
    keySeq: '$',
    requires: ['motion_0$^']
  },
  {
    name: 'Ch1: i enters insert before cursor',
    initLines: ['abc'],
    cursor: { line: 1, col: 2 },
    keySeq: 'iXY<Esc>',
    requires: ['insert_basic']
  },
  {
    name: 'Ch1: a enters insert after cursor',
    initLines: ['abc'],
    cursor: { line: 1, col: 2 },
    keySeq: 'aXY<Esc>',
    requires: ['insert_basic']
  },
  {
    name: 'Ch1: I enters insert at start',
    initLines: ['  abc'],
    cursor: { line: 1, col: 4 },
    keySeq: 'IX<Esc>',
    requires: ['insert_basic']
  },
  {
    name: 'Ch1: A enters insert at end',
    initLines: ['abc'],
    cursor: { line: 1, col: 1 },
    keySeq: 'AX<Esc>',
    requires: ['insert_basic']
  },
  {
    name: 'Ch1: o opens line below',
    initLines: ['abc'],
    cursor: { line: 1, col: 1 },
    keySeq: 'oXY<Esc>',
    requires: ['insert_basic']
  },
  {
    name: 'Ch1: O opens line above',
    initLines: ['abc'],
    cursor: { line: 1, col: 1 },
    keySeq: 'OXY<Esc>',
    requires: ['insert_basic']
  },

  // ========== Chapter 2: Word Motions and Small Edits ==========
  {
    name: 'Ch2: w jumps to next word',
    initLines: ['foo bar baz'],
    cursor: { line: 1, col: 1 },
    keySeq: 'w',
    requires: ['motion_word']
  },
  {
    name: 'Ch2: w stops at slash after punctuation',
    initLines: ['aaa; // TODO'],
    cursor: { line: 1, col: 4 },
    keySeq: 'w',
    requires: ['motion_word']
  },
  {
    name: 'Ch2: b jumps back to word start',
    initLines: ['foo bar baz'],
    cursor: { line: 1, col: 9 },
    keySeq: 'b',
    requires: ['motion_word']
  },
  {
    name: 'Ch2: e jumps to word end',
    initLines: ['foo bar'],
    cursor: { line: 1, col: 1 },
    keySeq: 'e',
    requires: ['motion_word']
  },
  {
    name: 'Ch2: W jumps by WORD',
    initLines: ['foo,bar baz'],
    cursor: { line: 1, col: 1 },
    keySeq: 'W',
    requires: ['motion_WORD']
  },
  {
    name: 'Ch2: B jumps back by WORD',
    initLines: ['foo,bar baz'],
    cursor: { line: 1, col: 9 },
    keySeq: 'B',
    requires: ['motion_WORD']
  },
  {
    name: 'Ch2: E jumps to WORD end',
    initLines: ['foo,bar baz'],
    cursor: { line: 1, col: 1 },
    keySeq: 'E',
    requires: ['motion_WORD']
  },
  {
    name: 'Ch2: x deletes character',
    initLines: ['abc'],
    cursor: { line: 1, col: 2 },
    keySeq: 'x',
    requires: ['edit_chars']
  },
  {
    name: 'Ch2: s replaces character and enters insert',
    initLines: ['abc'],
    cursor: { line: 1, col: 2 },
    keySeq: 'sX<Esc>',
    requires: ['edit_chars', 'insert_basic']
  },
  {
    name: 'Ch2: r replaces single character',
    initLines: ['abc'],
    cursor: { line: 1, col: 2 },
    keySeq: 'rX',
    requires: ['edit_chars']
  },
  {
    name: 'Ch2: ru replaces with literal u',
    initLines: ['abc'],
    cursor: { line: 1, col: 2 },
    keySeq: 'ru',
    requires: ['edit_chars']
  },

  // ========== Chapter 3: Operators ==========
  {
    name: 'Ch3: dw deletes word',
    initLines: ['foo bar'],
    cursor: { line: 1, col: 1 },
    keySeq: 'dw',
    requires: ['motion_word', 'operator_delete']
  },
  {
    name: 'Ch3: db deletes back word',
    initLines: ['foo bar'],
    cursor: { line: 1, col: 5 },
    keySeq: 'db',
    requires: ['motion_word', 'operator_delete']
  },
  {
    name: 'Ch3: de deletes to word end',
    initLines: ['foo bar'],
    cursor: { line: 1, col: 1 },
    keySeq: 'de',
    requires: ['motion_word', 'operator_delete']
  },
  {
    name: 'Ch3: d$ deletes to end of line',
    initLines: ['hello world'],
    cursor: { line: 1, col: 7 },
    keySeq: 'd$',
    requires: ['motion_0$^', 'operator_delete']
  },
  {
    name: 'Ch3: d0 deletes to start of line',
    initLines: ['hello world'],
    cursor: { line: 1, col: 7 },
    keySeq: 'd0',
    requires: ['motion_0$^', 'operator_delete']
  },
  {
    name: 'Ch3: d^ deletes to first non-blank',
    initLines: ['  hello world'],
    cursor: { line: 1, col: 9 },
    keySeq: 'd^',
    requires: ['motion_0$^', 'operator_delete']
  },
  {
    name: 'Ch3: dd deletes whole line',
    initLines: ['foo', 'bar', 'baz'],
    cursor: { line: 2, col: 1 },
    keySeq: 'dd',
    requires: ['operator_delete']
  },
  {
    name: 'Ch3: cw changes word',
    initLines: ['foo bar'],
    cursor: { line: 1, col: 1 },
    keySeq: 'cwXY<Esc>',
    requires: ['motion_word', 'operator_change', 'insert_basic']
  },
  {
    name: 'Ch3: ce changes to word end',
    initLines: ['foo bar'],
    cursor: { line: 1, col: 1 },
    keySeq: 'ceXY<Esc>',
    requires: ['motion_word', 'operator_change', 'insert_basic']
  },
  {
    name: 'Ch3: c$ changes to end',
    initLines: ['hello world'],
    cursor: { line: 1, col: 7 },
    keySeq: 'c$abc<Esc>',
    requires: ['motion_0$^', 'operator_change', 'insert_basic']
  },
  {
    name: 'Ch3: c0 changes to start',
    initLines: ['hello world'],
    cursor: { line: 1, col: 7 },
    keySeq: 'c0abc<Esc>',
    requires: ['motion_0$^', 'operator_change', 'insert_basic']
  },
  {
    name: 'Ch3: yw yanks word',
    initLines: ['foo bar'],
    cursor: { line: 1, col: 1 },
    keySeq: 'ywep',
    requires: ['motion_word', 'operator_yank', 'paste']
  },
  {
    name: 'Ch3: y$ yanks to end',
    initLines: ['hello world'],
    cursor: { line: 1, col: 7 },
    keySeq: 'y$0p',
    requires: ['motion_0$^', 'operator_yank', 'paste']
  },
  {
    name: 'Ch3: yy yanks line',
    initLines: ['foo', 'bar'],
    cursor: { line: 1, col: 1 },
    keySeq: 'yyp',
    requires: ['operator_yank', 'paste']
  },
  {
    name: 'Ch3: p pastes after cursor',
    initLines: ['foo bar'],
    cursor: { line: 1, col: 1 },
    keySeq: 'ywep',
    requires: ['motion_word', 'operator_yank', 'paste']
  },
  {
    name: 'Ch3: P pastes before cursor',
    initLines: ['foo bar'],
    cursor: { line: 1, col: 5 },
    keySeq: 'ywP',
    requires: ['motion_word', 'operator_yank', 'paste']
  },
  {
    name: 'Ch3: u undoes change',
    initLines: ['hello'],
    cursor: { line: 1, col: 1 },
    keySeq: 'xu',
    requires: ['edit_chars', 'undo_redo']
  },
  {
    name: 'Ch3: u then Ctrl-r redoes',
    initLines: ['hello'],
    cursor: { line: 1, col: 1 },
    keySeq: 'xu<C-r>',
    requires: ['edit_chars', 'undo_redo']
  },
  {
    name: 'Ch3: 3w count prefix',
    initLines: ['a b c d'],
    cursor: { line: 1, col: 1 },
    keySeq: '3w',
    requires: ['motion_word', 'count_prefix']
  },
  {
    name: 'Ch3: 2dw count with operator',
    initLines: ['foo bar baz qux'],
    cursor: { line: 1, col: 1 },
    keySeq: '2dw',
    requires: ['motion_word', 'operator_delete', 'count_prefix']
  },
  {
    name: 'Ch3: . repeats change',
    initLines: ['foo bar'],
    cursor: { line: 1, col: 1 },
    keySeq: 'x.',
    requires: ['edit_chars', 'dot_command']
  },
  {
    name: 'Ch3: . repeats dw',
    initLines: ['foo bar baz'],
    cursor: { line: 1, col: 1 },
    keySeq: 'dw.',
    requires: ['motion_word', 'operator_delete', 'dot_command']
  },

  // ========== Chapter 4: Find/Till ==========
  {
    name: 'Ch4: fx finds char forward',
    initLines: ['foo,bar,baz'],
    cursor: { line: 1, col: 1 },
    keySeq: 'f,',
    requires: ['find_char']
  },
  {
    name: 'Ch4: Fx finds char backward',
    initLines: ['foo,bar,baz'],
    cursor: { line: 1, col: 9 },
    keySeq: 'F,',
    requires: ['find_char']
  },
  {
    name: 'Ch4: tx till char forward',
    initLines: ['foo,bar'],
    cursor: { line: 1, col: 1 },
    keySeq: 't,',
    requires: ['find_char']
  },
  {
    name: 'Ch4: Tx till char backward',
    initLines: ['foo,bar'],
    cursor: { line: 1, col: 5 },
    keySeq: 'T,',
    requires: ['find_char']
  },
  {
    name: 'Ch4: ; repeats find',
    initLines: ['a,b,c'],
    cursor: { line: 1, col: 1 },
    keySeq: 'f,;',
    requires: ['find_char', 'find_repeat']
  },
  {
    name: 'Ch4: , reverses find',
    initLines: ['a,b,c'],
    cursor: { line: 1, col: 1 },
    keySeq: 'f,;,',
    requires: ['find_char', 'find_repeat']
  },
  {
    name: 'Ch4: dfx deletes to char',
    initLines: ['foo,bar'],
    cursor: { line: 1, col: 1 },
    keySeq: 'df,',
    requires: ['find_char', 'operator_delete']
  },
  {
    name: 'Ch4: dtx deletes till char',
    initLines: ['foo,bar'],
    cursor: { line: 1, col: 1 },
    keySeq: 'dt,',
    requires: ['find_char', 'operator_delete']
  },
  {
    name: 'Ch4: cfx changes to char',
    initLines: ['foo,bar'],
    cursor: { line: 1, col: 1 },
    keySeq: 'cf,X<Esc>',
    requires: ['find_char', 'operator_change', 'insert_basic']
  },
  {
    name: 'Ch4: ctx changes till char',
    initLines: ['foo,bar'],
    cursor: { line: 1, col: 1 },
    keySeq: 'ct,X<Esc>',
    requires: ['find_char', 'operator_change', 'insert_basic']
  },

  // ========== Chapter 5: Text Objects ==========
  {
    name: 'Ch5: diw deletes inner word',
    initLines: ['foo bar'],
    cursor: { line: 1, col: 2 },
    keySeq: 'diw',
    requires: ['textobj_word', 'operator_delete']
  },
  {
    name: 'Ch5: daw deletes a word with space',
    initLines: ['foo bar'],
    cursor: { line: 1, col: 2 },
    keySeq: 'daw',
    requires: ['textobj_word', 'operator_delete']
  },
  {
    name: 'Ch5: ciw changes inner word',
    initLines: ['foo bar'],
    cursor: { line: 1, col: 2 },
    keySeq: 'ciwXY<Esc>',
    requires: ['textobj_word', 'operator_change', 'insert_basic']
  },
  {
    name: 'Ch5: yiw yanks inner word',
    initLines: ['foo bar'],
    cursor: { line: 1, col: 2 },
    keySeq: 'yiwep',
    requires: ['textobj_word', 'operator_yank', 'paste', 'motion_word']
  },
  {
    name: 'Ch5: dip deletes inner paragraph',
    initLines: ['', 'foo', 'bar', '', 'baz'],
    cursor: { line: 2, col: 1 },
    keySeq: 'dip',
    requires: ['textobj_para', 'operator_delete']
  },
  {
    name: 'Ch5: dap deletes paragraph with blank',
    initLines: ['', 'foo', 'bar', '', 'baz'],
    cursor: { line: 2, col: 1 },
    keySeq: 'dap',
    requires: ['textobj_para', 'operator_delete']
  },
  {
    name: 'Ch5: di( deletes inside parens',
    initLines: ['foo(bar)baz'],
    cursor: { line: 1, col: 5 },
    keySeq: 'di(',
    requires: ['textobj_bracket', 'operator_delete']
  },
  {
    name: 'Ch5: da( deletes around parens',
    initLines: ['foo(bar)baz'],
    cursor: { line: 1, col: 5 },
    keySeq: 'da(',
    requires: ['textobj_bracket', 'operator_delete']
  },
  {
    name: 'Ch5: di{ deletes inside braces',
    initLines: ['foo{bar}baz'],
    cursor: { line: 1, col: 5 },
    keySeq: 'di{',
    requires: ['textobj_bracket', 'operator_delete']
  },
  {
    name: 'Ch5: di[ deletes inside brackets',
    initLines: ['foo[bar]baz'],
    cursor: { line: 1, col: 5 },
    keySeq: 'di[',
    requires: ['textobj_bracket', 'operator_delete']
  },
  {
    name: 'Ch5: di" deletes inside double quotes',
    initLines: ['foo"bar"baz'],
    cursor: { line: 1, col: 5 },
    keySeq: 'di"',
    requires: ['textobj_quote', 'operator_delete']
  },
  {
    name: "Ch5: di' deletes inside single quotes",
    initLines: ["foo'bar'baz"],
    cursor: { line: 1, col: 5 },
    keySeq: "di'",
    requires: ['textobj_quote', 'operator_delete']
  },
  {
    name: 'Ch5: da" deletes around quotes',
    initLines: ['foo"bar"baz'],
    cursor: { line: 1, col: 5 },
    keySeq: 'da"',
    requires: ['textobj_quote', 'operator_delete']
  },

  // ========== Chapter 6: Search ==========
  {
    name: 'Ch6: /pattern searches forward',
    initLines: ['foo', 'bar', 'foo'],
    cursor: { line: 1, col: 1 },
    keySeq: '/bar<CR>',
    requires: ['search_basic']
  },
  {
    name: 'Ch6: ?pattern searches backward',
    initLines: ['foo', 'bar', 'foo'],
    cursor: { line: 3, col: 1 },
    keySeq: '?bar<CR>',
    requires: ['search_basic']
  },
  {
    name: 'Ch6: n jumps to next match',
    initLines: ['foo', 'bar', 'foo'],
    cursor: { line: 1, col: 1 },
    keySeq: '/foo<CR>n',
    requires: ['search_basic']
  },
  {
    name: 'Ch6: N jumps to previous match',
    initLines: ['foo', 'bar', 'foo'],
    cursor: { line: 3, col: 1 },
    keySeq: '/foo<CR>N',
    requires: ['search_basic']
  },
  {
    name: 'Ch6: * searches word under cursor',
    initLines: ['foo', 'bar', 'foo'],
    cursor: { line: 1, col: 1 },
    keySeq: '*',
    requires: ['search_basic']
  },
  {
    name: 'Ch6: # searches word backward',
    initLines: ['foo', 'bar', 'foo'],
    cursor: { line: 3, col: 1 },
    keySeq: '#',
    requires: ['search_basic']
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
