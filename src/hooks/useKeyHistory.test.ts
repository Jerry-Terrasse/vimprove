import { describe, it, expect, beforeEach } from 'vitest';
import { createKeyHistoryManager } from './useKeyHistory';
import { INITIAL_VIM_STATE } from '@/core/vimReducer';
import type { VimState, Command } from '@/core/types';

const makeState = (partial: Partial<VimState> = {}): VimState => ({
  ...INITIAL_VIM_STATE,
  buffer: partial.buffer ?? [''],
  cursor: partial.cursor ?? { line: 0, col: 0 },
  ...partial
});

describe('useKeyHistory status detection', () => {
  let hook: ReturnType<typeof useKeyHistory>;

  beforeEach(() => {
    hook = createKeyHistoryManager();
    hook.clearHistory();
  });

  it('marks yank as applied even without buffer or cursor change', () => {
    const state0 = makeState({ buffer: ['abc'], cursor: { line: 0, col: 0 } });
    const state1 = makeState({ ...state0, pendingOperator: 'y' });
    hook.recordKey('y', false, state0, state1);

    const yankCommand: Command = { type: 'yank' };
    const state2 = makeState({
      ...state1,
      pendingOperator: null,
      lastCommand: yankCommand,
      register: 'abc\n'
    });
    hook.recordKey('y', false, state1, state2);

    const history = hook.getHistory();
    expect(history.at(-1)?.status).toBe('applied');
  });

  it('marks failed find-char as cancelled', () => {
    const state0 = makeState({ buffer: ['abc'], cursor: { line: 0, col: 0 } });
    const state1 = makeState({ ...state0, pendingFind: 'f' });
    hook.recordKey('f', false, state0, state1);

    const state2 = makeState({
      ...state1,
      pendingFind: null,
      lastFind: null
    });
    hook.recordKey('z', false, state1, state2);

    const history = hook.getHistory();
    expect(history.at(-1)?.status).toBe('cancelled');
  });

  it('marks find-char success as applied even if cursor stays', () => {
    const state0 = makeState({ buffer: ['ab'], cursor: { line: 0, col: 0 } });
    const state1 = makeState({ ...state0, pendingFind: 't' });
    hook.recordKey('t', false, state0, state1);

    const state2 = makeState({
      ...state1,
      pendingFind: null,
      lastFind: { type: 't', char: 'b' }
    });
    hook.recordKey('b', false, state1, state2);

    const history = hook.getHistory();
    expect(history.at(-1)?.status).toBe('applied');
  });

  it('marks search state update as applied even without movement', () => {
    const state0 = makeState();
    const state1 = makeState({
      ...state0,
      pendingSearch: { direction: 'forward', pattern: '' }
    });
    hook.recordKey('/', false, state0, state1);

    const state2 = makeState({
      ...state1,
      pendingSearch: { direction: 'forward', pattern: 'a' }
    });
    hook.recordKey('a', false, state1, state2);

    const state3 = makeState({
      ...state2,
      pendingSearch: null,
      lastSearch: { direction: 'forward', pattern: 'a' }
    });
    hook.recordKey('Enter', false, state2, state3);

    const history = hook.getHistory();
    expect(history.at(-1)?.status).toBe('applied');
  });
});
