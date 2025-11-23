import { describe, it, expect } from 'vitest';
import { applyOperatorWithMotion } from './operators';
import type { VimState } from './types';
import { INITIAL_VIM_STATE } from './vimReducer';

// Helper function to create test VimState
const createState = (
  buffer: string[],
  cursor: { line: number; col: number },
  overrides?: Partial<VimState>
): VimState => ({
  ...INITIAL_VIM_STATE,
  buffer,
  cursor,
  ...overrides,
});

describe('operators', () => {
  describe('applyOperatorWithMotion', () => {
    describe('delete (d) operator', () => {
      it('should delete forward on same line (dw)', () => {
        const state = createState(['hello world'], { line: 0, col: 0 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', 'w');

        expect(result.buffer).toEqual(['world']);
        expect(result.cursor).toEqual({ line: 0, col: 0 });
        expect(result.pendingOperator).toBeNull();
        expect(result.register).toBe('hello ');
      });

      it('should delete backward on same line (db from middle)', () => {
        const state = createState(['hello world'], { line: 0, col: 6 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', 'b');

        expect(result.buffer).toEqual(['world']);
        expect(result.cursor).toEqual({ line: 0, col: 0 });
        expect(result.register).toBe('hello ');
      });

      it('should delete to end of line (d$)', () => {
        const state = createState(['hello world'], { line: 0, col: 6 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', '$');

        expect(result.buffer).toEqual(['hello ']);
        expect(result.cursor).toEqual({ line: 0, col: 5 });
        expect(result.register).toBe('world');
      });

      it('should place cursor on last remaining character after d$ at line end', () => {
        const state = createState(['abc'], { line: 0, col: 2 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', '$');

        expect(result.buffer).toEqual(['ab']);
        expect(result.cursor).toEqual({ line: 0, col: 1 });
        expect(result.register).toBe('c');
      });

      it('should delete to start of line (d0)', () => {
        const state = createState(['hello world'], { line: 0, col: 6 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', '0');

        expect(result.buffer).toEqual(['world']);
        expect(result.cursor).toEqual({ line: 0, col: 0 });
        expect(result.register).toBe('hello ');
      });

      it('should delete single character (dh)', () => {
        const state = createState(['hello'], { line: 0, col: 3 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', 'h');

        expect(result.buffer).toEqual(['helo']);
        expect(result.cursor).toEqual({ line: 0, col: 2 });
        expect(result.register).toBe('l');
      });

      it('should delete single character forward (dl)', () => {
        const state = createState(['hello'], { line: 0, col: 1 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', 'l');

        expect(result.buffer).toEqual(['hllo']);
        expect(result.cursor).toEqual({ line: 0, col: 1 });
        expect(result.register).toBe('e');
      });

      it('should delete to end of word (de)', () => {
        const state = createState(['hello world'], { line: 0, col: 1 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', 'e');

        expect(result.buffer).toEqual(['h world']);
        expect(result.cursor).toEqual({ line: 0, col: 1 });
        expect(result.register).toBe('ello');
      });

      it('should handle delete when cursor is at end of line', () => {
        const state = createState(['hello'], { line: 0, col: 4 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', 'l');

        // 'l' motion doesn't move at end of line, so nothing should be deleted
        expect(result.buffer).toEqual(['hello']);
      });
    });

    describe('change (c) operator', () => {
      it('should delete and enter insert mode (cw)', () => {
        const state = createState(['hello world'], { line: 0, col: 0 }, { pendingOperator: 'c' });
        const result = applyOperatorWithMotion(state, 'c', 'w');

        expect(result.buffer).toEqual([' world']);
        expect(result.mode).toBe('insert');
        expect(result.cursor).toEqual({ line: 0, col: 0 });
        expect(result.register).toBe('hello');
        expect(result.pendingOperator).toBeNull();
      });

      it('should change to end of line (c$)', () => {
        const state = createState(['hello world'], { line: 0, col: 6 }, { pendingOperator: 'c' });
        const result = applyOperatorWithMotion(state, 'c', '$');

        expect(result.buffer).toEqual(['hello ']);
        expect(result.mode).toBe('insert');
        expect(result.cursor).toEqual({ line: 0, col: 5 });
        expect(result.register).toBe('world');
      });

      it('should change to start of line (c0)', () => {
        const state = createState(['hello world'], { line: 0, col: 6 }, { pendingOperator: 'c' });
        const result = applyOperatorWithMotion(state, 'c', '0');

        expect(result.buffer).toEqual(['world']);
        expect(result.mode).toBe('insert');
        expect(result.cursor).toEqual({ line: 0, col: 0 });
      });

      it('should change backward (cb)', () => {
        const state = createState(['hello world'], { line: 0, col: 6 }, { pendingOperator: 'c' });
        const result = applyOperatorWithMotion(state, 'c', 'b');

        expect(result.buffer).toEqual(['world']);
        expect(result.mode).toBe('insert');
        expect(result.cursor).toEqual({ line: 0, col: 0 });
      });
    });

    describe('yank (y) operator', () => {
      it('should yank without modifying buffer (yw)', () => {
        const state = createState(['hello world'], { line: 0, col: 0 }, { pendingOperator: 'y' });
        const result = applyOperatorWithMotion(state, 'y', 'w');

        expect(result.buffer).toEqual(['hello world']); // unchanged
        expect(result.cursor).toEqual({ line: 0, col: 0 }); // unchanged
        expect(result.register).toBe('hello ');
        expect(result.pendingOperator).toBeNull();
        expect(result.mode).toBe('normal'); // stays in normal mode
      });

      it('should yank to end of line (y$)', () => {
        const state = createState(['hello world'], { line: 0, col: 6 }, { pendingOperator: 'y' });
        const result = applyOperatorWithMotion(state, 'y', '$');

        expect(result.buffer).toEqual(['hello world']);
        expect(result.register).toBe('world');
      });

      it('should yank backward (yb)', () => {
        const state = createState(['hello world'], { line: 0, col: 6 }, { pendingOperator: 'y' });
        const result = applyOperatorWithMotion(state, 'y', 'b');

        expect(result.buffer).toEqual(['hello world']);
        expect(result.register).toBe('hello ');
      });

      it('should yank to first non-blank (y^)', () => {
        const state = createState(['  hello world'], { line: 0, col: 8 }, { pendingOperator: 'y' });
        const result = applyOperatorWithMotion(state, 'y', '^');

        expect(result.buffer).toEqual(['  hello world']);
        expect(result.register).toBe('hello ');
      });
    });

    describe('motion directions', () => {
      it('should handle delete when motion is backward', () => {
        const state = createState(['hello world'], { line: 0, col: 6 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', '0');

        // Should delete from beginning to cursor
        expect(result.buffer).toEqual(['world']);
        expect(result.cursor).toEqual({ line: 0, col: 0 });
      });

      it('should handle delete when motion is forward', () => {
        const state = createState(['hello world'], { line: 0, col: 0 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', '$');

        // Should delete from cursor to end
        expect(result.buffer).toEqual(['']);
        expect(result.cursor).toEqual({ line: 0, col: 0 });
      });
    });

    describe('word motions with punctuation', () => {
      it('should delete punctuation as separate word (dw)', () => {
        const state = createState(['hello,world'], { line: 0, col: 0 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', 'w');

        expect(result.buffer).toEqual([',world']);
        expect(result.register).toBe('hello');
      });

      it('should delete WORD including punctuation (dW)', () => {
        const state = createState(['hello,world test'], { line: 0, col: 0 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', 'W');

        expect(result.buffer).toEqual(['test']);
        expect(result.register).toBe('hello,world ');
      });
    });

    describe('edge cases', () => {
      it('should handle empty line', () => {
        const state = createState([''], { line: 0, col: 0 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', 'w');

        expect(result.buffer).toEqual(['']);
      });

      it('should handle single character', () => {
        const state = createState(['a'], { line: 0, col: 0 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', 'l');

        // 'l' on last character doesn't move, so nothing deleted
        expect(result.buffer).toEqual(['a']);
      });

      it('should handle operator at start of buffer', () => {
        const state = createState(['hello'], { line: 0, col: 0 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', 'h');

        // 'h' at start doesn't move, so nothing deleted
        expect(result.buffer).toEqual(['hello']);
      });

      it('should handle delete entire line with d$', () => {
        const state = createState(['hello'], { line: 0, col: 0 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', '$');

        expect(result.buffer).toEqual(['']);
        expect(result.register).toBe('hello');
      });
    });

    describe('history tracking', () => {
      it('should add to history for delete operation', () => {
        const state = createState(['hello world'], { line: 0, col: 0 }, {
          pendingOperator: 'd',
          history: [],
          historyIndex: -1
        });
        const result = applyOperatorWithMotion(state, 'd', 'w');

        expect(result.history.length).toBe(1);
        expect(result.historyIndex).toBe(0);
      });

      it('should add to history for change operation', () => {
        const state = createState(['hello world'], { line: 0, col: 0 }, {
          pendingOperator: 'c',
          history: [],
          historyIndex: -1
        });
        const result = applyOperatorWithMotion(state, 'c', 'w');

        expect(result.history.length).toBe(1);
        expect(result.historyIndex).toBe(0);
      });

      it('should not add to history for yank operation', () => {
        const state = createState(['hello world'], { line: 0, col: 0 }, {
          pendingOperator: 'y',
          history: [],
          historyIndex: -1
        });
        const result = applyOperatorWithMotion(state, 'y', 'w');

        expect(result.history.length).toBe(0);
        expect(result.historyIndex).toBe(-1);
      });
    });

    describe('register yanking', () => {
      it('should save deleted text to register', () => {
        const state = createState(['hello world'], { line: 0, col: 0 }, { pendingOperator: 'd' });
        const result = applyOperatorWithMotion(state, 'd', 'w');

        expect(result.register).toBe('hello ');
      });

      it('should save changed text to register', () => {
        const state = createState(['hello world'], { line: 0, col: 0 }, { pendingOperator: 'c' });
        const result = applyOperatorWithMotion(state, 'c', 'e');

        expect(result.register).toBe('hello');
      });

      it('should save yanked text to register', () => {
        const state = createState(['hello world'], { line: 0, col: 0 }, { pendingOperator: 'y' });
        const result = applyOperatorWithMotion(state, 'y', 'w');

        expect(result.register).toBe('hello ');
      });

      it('should overwrite previous register content', () => {
        const state = createState(['hello world'], { line: 0, col: 0 }, {
          pendingOperator: 'd',
          register: 'old content'
        });
        const result = applyOperatorWithMotion(state, 'd', 'w');

        expect(result.register).toBe('hello ');
      });
    });
  });
});
