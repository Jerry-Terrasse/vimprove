import { describe, it, expect } from 'vitest';
import { vimReducer, INITIAL_VIM_STATE } from './vimReducer';
import type { VimState } from './types';

// Helper to dispatch a key
const pressKey = (state: VimState, key: string, ctrlKey = false): VimState => {
  return vimReducer(state, { type: 'KEYDOWN', payload: { key, ctrlKey } });
};

// Helper to type multiple keys in sequence
const typeKeys = (state: VimState, keys: string): VimState => {
  let currentState = state;
  let i = 0;
  while (i < keys.length) {
    // Handle special key sequences
    if (keys[i] === '<') {
      const closeIdx = keys.indexOf('>', i);
      if (closeIdx !== -1) {
        const special = keys.substring(i + 1, closeIdx);
        if (special === 'Esc') {
          currentState = pressKey(currentState, 'Escape');
        } else if (special === 'CR') {
          currentState = pressKey(currentState, 'Enter');
        } else if (special === 'BS') {
          currentState = pressKey(currentState, 'Backspace');
        } else {
          // Unknown special key, treat as literal
          currentState = pressKey(currentState, keys[i]);
        }
        i = closeIdx + 1;
        continue;
      }
    }
    // Regular character
    currentState = pressKey(currentState, keys[i]);
    i++;
  }
  return currentState;
};

describe('vimReducer', () => {
  describe('RESET action', () => {
    it('should reset to initial state', () => {
      const modifiedState = pressKey(INITIAL_VIM_STATE, 'i');
      const resetState = vimReducer(modifiedState, { type: 'RESET' });

      expect(resetState.mode).toBe('normal');
      expect(resetState.buffer).toEqual(['']);
    });

    it('should accept custom initial state', () => {
      const customState = vimReducer(INITIAL_VIM_STATE, {
        type: 'RESET',
        payload: {
          buffer: ['hello', 'world'],
          cursor: { line: 1, col: 2 }
        }
      });

      expect(customState.buffer).toEqual(['hello', 'world']);
      expect(customState.cursor).toEqual({ line: 1, col: 2 });
    });
  });

  describe('Insert Mode', () => {
    describe('entering insert mode', () => {
      it('should enter insert mode with i', () => {
        const state = pressKey(INITIAL_VIM_STATE, 'i');
        expect(state.mode).toBe('insert');
      });

      it('should enter insert mode with a', () => {
        const initial = { ...INITIAL_VIM_STATE, buffer: ['hello'], cursor: { line: 0, col: 2 } };
        const state = pressKey(initial, 'a');

        expect(state.mode).toBe('insert');
        expect(state.cursor.col).toBe(3); // moved one position right
      });

      it('should enter insert mode with I at first non-blank', () => {
        const initial = { ...INITIAL_VIM_STATE, buffer: ['  hello'], cursor: { line: 0, col: 4 } };
        const state = pressKey(initial, 'I');

        expect(state.mode).toBe('insert');
        expect(state.cursor.col).toBe(2); // at first non-whitespace
      });

      it('should enter insert mode with A at end of line', () => {
        const initial = { ...INITIAL_VIM_STATE, buffer: ['hello'], cursor: { line: 0, col: 2 } };
        const state = pressKey(initial, 'A');

        expect(state.mode).toBe('insert');
        expect(state.cursor.col).toBe(5); // at end of line
      });

      it('should enter insert mode with o on new line below', () => {
        const initial = { ...INITIAL_VIM_STATE, buffer: ['hello'], cursor: { line: 0, col: 2 } };
        const state = pressKey(initial, 'o');

        expect(state.mode).toBe('insert');
        expect(state.buffer).toEqual(['hello', '']);
        expect(state.cursor).toEqual({ line: 1, col: 0 });
      });

      it('should enter insert mode with O on new line above', () => {
        const initial = { ...INITIAL_VIM_STATE, buffer: ['world'], cursor: { line: 0, col: 2 } };
        const state = pressKey(initial, 'O');

        expect(state.mode).toBe('insert');
        expect(state.buffer).toEqual(['', 'world']);
        expect(state.cursor).toEqual({ line: 0, col: 0 });
      });
    });

    describe('insert mode operations', () => {
      it('should insert text at cursor position', () => {
        let state = pressKey(INITIAL_VIM_STATE, 'i');
        state = typeKeys(state, 'hello');

        expect(state.buffer[0]).toBe('hello');
        expect(state.cursor.col).toBe(5);
      });

      it('should handle Backspace', () => {
        let state = pressKey(INITIAL_VIM_STATE, 'i');
        state = typeKeys(state, 'hello<BS><BS>');

        expect(state.buffer[0]).toBe('hel');
        expect(state.cursor.col).toBe(3);
      });

      it('should handle Enter to create new line', () => {
        let state = pressKey(INITIAL_VIM_STATE, 'i');
        state = typeKeys(state, 'hello<CR>world');

        expect(state.buffer).toEqual(['hello', 'world']);
        expect(state.cursor).toEqual({ line: 1, col: 5 });
      });

      it('should join lines with Backspace at start of line', () => {
        let state = { ...INITIAL_VIM_STATE, buffer: ['hello', 'world'], cursor: { line: 1, col: 0 } };
        state = pressKey(state, 'i');
        state = pressKey(state, 'Backspace');

        expect(state.buffer).toEqual(['helloworld']);
        expect(state.cursor).toEqual({ line: 0, col: 5 });
      });
    });

    describe('exiting insert mode', () => {
      it('should exit insert mode with Escape', () => {
        let state = pressKey(INITIAL_VIM_STATE, 'i');
        state = typeKeys(state, 'hello');
        state = pressKey(state, 'Escape');

        expect(state.mode).toBe('normal');
        expect(state.cursor.col).toBe(4); // moved back one column
      });

      it('should not move cursor left when exiting from column 0', () => {
        let state = pressKey(INITIAL_VIM_STATE, 'i');
        state = pressKey(state, 'Escape');

        expect(state.mode).toBe('normal');
        expect(state.cursor.col).toBe(0);
      });
    });
  });

  describe('Normal Mode - Navigation', () => {
    const testBuffer = ['hello world', 'test line', 'final'];

    it('should move left with h', () => {
      const initial = { ...INITIAL_VIM_STATE, buffer: testBuffer, cursor: { line: 0, col: 5 } };
      const state = pressKey(initial, 'h');

      expect(state.cursor.col).toBe(4);
    });

    it('should move right with l', () => {
      const initial = { ...INITIAL_VIM_STATE, buffer: testBuffer, cursor: { line: 0, col: 5 } };
      const state = pressKey(initial, 'l');

      expect(state.cursor.col).toBe(6);
    });

    it('should move down with j', () => {
      const initial = { ...INITIAL_VIM_STATE, buffer: testBuffer, cursor: { line: 0, col: 5 } };
      const state = pressKey(initial, 'j');

      expect(state.cursor.line).toBe(1);
      expect(state.cursor.col).toBe(5);
    });

    it('should move up with k', () => {
      const initial = { ...INITIAL_VIM_STATE, buffer: testBuffer, cursor: { line: 1, col: 5 } };
      const state = pressKey(initial, 'k');

      expect(state.cursor.line).toBe(0);
      expect(state.cursor.col).toBe(5);
    });

    it('should move to line start with 0', () => {
      const initial = { ...INITIAL_VIM_STATE, buffer: testBuffer, cursor: { line: 0, col: 5 } };
      const state = pressKey(initial, '0');

      expect(state.cursor.col).toBe(0);
    });

    it('should move to line end with $', () => {
      const initial = { ...INITIAL_VIM_STATE, buffer: testBuffer, cursor: { line: 0, col: 0 } };
      const state = pressKey(initial, '$');

      expect(state.cursor.col).toBe(10); // 'hello world'.length - 1
    });

    it('should move word forward with w', () => {
      const initial = { ...INITIAL_VIM_STATE, buffer: testBuffer, cursor: { line: 0, col: 0 } };
      const state = pressKey(initial, 'w');

      expect(state.cursor.col).toBe(6); // start of 'world'
    });

    it('should move word backward with b', () => {
      const initial = { ...INITIAL_VIM_STATE, buffer: testBuffer, cursor: { line: 0, col: 6 } };
      const state = pressKey(initial, 'b');

      expect(state.cursor.col).toBe(0); // start of 'hello'
    });

    it('should move to word end with e', () => {
      const initial = { ...INITIAL_VIM_STATE, buffer: testBuffer, cursor: { line: 0, col: 0 } };
      const state = pressKey(initial, 'e');

      expect(state.cursor.col).toBe(4); // end of 'hello'
    });
  });

  describe('Normal Mode - Editing', () => {
    it('should delete character with x', () => {
      const initial = { ...INITIAL_VIM_STATE, buffer: ['hello'], cursor: { line: 0, col: 1 } };
      const state = pressKey(initial, 'x');

      expect(state.buffer[0]).toBe('hllo');
      expect(state.cursor.col).toBe(1);
    });

    it('should substitute character with s', () => {
      const initial = { ...INITIAL_VIM_STATE, buffer: ['hello'], cursor: { line: 0, col: 1 } };
      const state = typeKeys(initial, 'sX<Esc>');

      expect(state.buffer[0]).toBe('hXllo');
      expect(state.mode).toBe('normal');
    });

    it('should replace character with r', () => {
      const initial = { ...INITIAL_VIM_STATE, buffer: ['hello'], cursor: { line: 0, col: 1 } };
      const state = typeKeys(initial, 'rX');

      expect(state.buffer[0]).toBe('hXllo');
      expect(state.mode).toBe('normal');
    });

    it('should delete line with dd', () => {
      const initial = { ...INITIAL_VIM_STATE, buffer: ['line1', 'line2', 'line3'], cursor: { line: 1, col: 0 } };
      const state = typeKeys(initial, 'dd');

      expect(state.buffer).toEqual(['line1', 'line3']);
      expect(state.cursor.line).toBe(1);
      expect(state.register).toBe('line2\n');
    });

    it('should delete word with dw', () => {
      const initial = { ...INITIAL_VIM_STATE, buffer: ['hello world'], cursor: { line: 0, col: 0 } };
      const state = typeKeys(initial, 'dw');

      expect(state.buffer[0]).toBe('world');
      expect(state.register).toBe('hello ');
    });

    it('should change word with cw', () => {
      const initial = { ...INITIAL_VIM_STATE, buffer: ['hello world'], cursor: { line: 0, col: 0 } };
      const state = typeKeys(initial, 'cwtest<Esc>');

      expect(state.buffer[0]).toBe('testworld');
      expect(state.mode).toBe('normal');
    });
  });

  describe('Yank and Paste', () => {
    it('should yank line with yy', () => {
      const initial = { ...INITIAL_VIM_STATE, buffer: ['hello', 'world'], cursor: { line: 0, col: 0 } };
      const state = typeKeys(initial, 'yy');

      expect(state.buffer).toEqual(['hello', 'world']); // unchanged
      expect(state.register).toBe('hello\n');
    });

    it('should yank word with yw', () => {
      const initial = { ...INITIAL_VIM_STATE, buffer: ['hello world'], cursor: { line: 0, col: 0 } };
      const state = typeKeys(initial, 'yw');

      expect(state.register).toBe('hello ');
      expect(state.buffer).toEqual(['hello world']); // unchanged
    });

    it('should paste after cursor with p (linewise)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello', 'world'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'yyp');

      expect(state.buffer).toEqual(['hello', 'hello', 'world']);
      expect(state.cursor.line).toBe(1);
    });

    it('should paste before cursor with P (linewise)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello', 'world'], cursor: { line: 1, col: 0 } };
      state = typeKeys(state, 'yyP');

      expect(state.buffer).toEqual(['hello', 'world', 'world']);
      expect(state.cursor.line).toBe(1);
    });

    it('should paste after cursor with p (characterwise)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello world'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'yw$p');

      expect(state.buffer[0]).toBe('hello worldhello ');
    });
  });

  describe('Undo/Redo', () => {
    it('should undo with u', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello'], cursor: { line: 0, col: 5 } };
      state = pressKey(state, 'i');
      state = typeKeys(state, ' world<Esc>');
      expect(state.buffer[0]).toBe('hello world');

      state = pressKey(state, 'u');
      expect(state.buffer[0]).toBe('hello');
    });

    it('should redo with Ctrl-r', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello'], cursor: { line: 0, col: 5 } };
      state = pressKey(state, 'i');
      state = typeKeys(state, ' world<Esc>');
      state = pressKey(state, 'u');
      expect(state.buffer[0]).toBe('hello');

      state = pressKey(state, 'r', true); // Ctrl-r
      expect(state.buffer[0]).toBe('hello world');
    });

    it('should handle multiple undos', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: [''] };
      state = typeKeys(state, 'ihello<Esc>');
      state = typeKeys(state, 'a world<Esc>');
      state = typeKeys(state, 'a!<Esc>');

      expect(state.buffer[0]).toBe('hello world!');

      state = pressKey(state, 'u');
      expect(state.buffer[0]).toBe('hello world');

      state = pressKey(state, 'u');
      expect(state.buffer[0]).toBe('hello');

      state = pressKey(state, 'u');
      expect(state.buffer[0]).toBe('');
    });
  });

  describe('Find commands', () => {
    const testLine = 'hello world test';

    it('should find character forward with f', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: [testLine], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'fo');

      expect(state.cursor.col).toBe(4); // first 'o' in 'hello'
    });

    it('should find character backward with F', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: [testLine], cursor: { line: 0, col: 10 } };
      state = typeKeys(state, 'Fo');

      expect(state.cursor.col).toBe(7); // 'o' in 'world'
    });

    it('should find till forward with t', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: [testLine], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'to');

      expect(state.cursor.col).toBe(3); // one before 'o'
    });

    it('should find till backward with T', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: [testLine], cursor: { line: 0, col: 10 } };
      state = typeKeys(state, 'To');

      expect(state.cursor.col).toBe(8); // one after 'o'
    });

    it('should repeat find with ;', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: [testLine], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'fo;');

      expect(state.cursor.col).toBe(7); // second 'o' in 'world'
    });

    it('should reverse find with ,', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: [testLine], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'fo;,');

      expect(state.cursor.col).toBe(4); // back to first 'o'
    });
  });

  describe('Count prefix', () => {
    it('should repeat motion with count (3w)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['one two three four'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, '3w');

      expect(state.cursor.col).toBe(14); // start of 'four'
    });

    it('should repeat delete with count (3x)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, '3x');

      expect(state.buffer[0]).toBe('lo');
    });

    it('should delete multiple lines with count (3dd)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['1', '2', '3', '4', '5'], cursor: { line: 1, col: 0 } };
      state = typeKeys(state, '3dd');

      expect(state.buffer).toEqual(['1', '5']);
    });

    it('should handle count with operator+motion (2dw)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['one two three'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, '2dw');

      expect(state.buffer[0]).toBe('three');
    });
  });

  describe('Escape key', () => {
    it('should clear pending operator', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello'] };
      state = pressKey(state, 'd');
      expect(state.pendingOperator).toBe('d');

      state = pressKey(state, 'Escape');
      expect(state.pendingOperator).toBeNull();
    });

    it('should clear pending replace', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello'] };
      state = pressKey(state, 'r');
      expect(state.pendingReplace).toBe(true);

      state = pressKey(state, 'Escape');
      expect(state.pendingReplace).toBe(false);
    });

    it('should clear count', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello'] };
      state = pressKey(state, '3');
      expect(state.count).toBe('3');

      state = pressKey(state, 'Escape');
      expect(state.count).toBe('');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty buffer', () => {
      const state = { ...INITIAL_VIM_STATE, buffer: [] };
      const result = pressKey(state, 'h');

      expect(result.buffer).toEqual(['']);
    });

    it('should not move cursor beyond buffer bounds', () => {
      const state = { ...INITIAL_VIM_STATE, buffer: ['hello'], cursor: { line: 0, col: 4 } };
      const result = pressKey(state, 'l');

      expect(result.cursor.col).toBe(4); // stays at end
    });

    it('should handle invalid commands gracefully', () => {
      const state = { ...INITIAL_VIM_STATE, buffer: ['hello'] };
      const result = pressKey(state, 'Z'); // unmapped key

      expect(result.buffer).toEqual(['hello']); // no changes
    });
  });
});
