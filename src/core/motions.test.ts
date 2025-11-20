import { describe, it, expect } from 'vitest';
import { findCharOnLine, getMotionTarget } from './motions';
import type { VimState } from './types';
import { INITIAL_VIM_STATE } from './vimReducer';

// Helper function to create test VimState
const createState = (buffer: string[], cursor: { line: number; col: number }): VimState => ({
  ...INITIAL_VIM_STATE,
  buffer,
  cursor,
});

describe('motions', () => {
  describe('findCharOnLine', () => {
    const line = 'hello world test';

    describe('f - find forward', () => {
      it('should find character forward', () => {
        expect(findCharOnLine(line, 0, 'o', 'f')).toBe(4);
        expect(findCharOnLine(line, 0, 'w', 'f')).toBe(6);
        expect(findCharOnLine(line, 0, 't', 'f')).toBe(12);
      });

      it('should find next occurrence from current position', () => {
        expect(findCharOnLine(line, 4, 'o', 'f')).toBe(7);
      });

      it('should return null if character not found', () => {
        expect(findCharOnLine(line, 0, 'z', 'f')).toBeNull();
        expect(findCharOnLine(line, 15, 'h', 'f')).toBeNull();
      });

      it('should not find character at current position', () => {
        expect(findCharOnLine(line, 4, 'o', 'f')).toBe(7); // skips position 4
      });
    });

    describe('F - find backward', () => {
      it('should find character backward', () => {
        expect(findCharOnLine(line, 10, 'o', 'F')).toBe(7);
        expect(findCharOnLine(line, 10, 'h', 'F')).toBe(0);
      });

      it('should return null if character not found backward', () => {
        expect(findCharOnLine(line, 5, 'w', 'F')).toBeNull();
        expect(findCharOnLine(line, 0, 'h', 'F')).toBeNull();
      });
    });

    describe('t - till forward', () => {
      it('should move to position before character', () => {
        expect(findCharOnLine(line, 0, 'o', 't')).toBe(3); // one before 'o' at index 4
        expect(findCharOnLine(line, 0, 'w', 't')).toBe(5);
      });

      it('should return null if character not found', () => {
        expect(findCharOnLine(line, 0, 'z', 't')).toBeNull();
      });
    });

    describe('T - till backward', () => {
      it('should move to position after character', () => {
        expect(findCharOnLine(line, 10, 'o', 'T')).toBe(8); // one after 'o' at index 7
        expect(findCharOnLine(line, 10, 'h', 'T')).toBe(1);
      });

      it('should return null if character not found backward', () => {
        expect(findCharOnLine(line, 5, 'w', 'T')).toBeNull();
      });
    });

    describe('edge cases', () => {
      it('should handle empty string', () => {
        expect(findCharOnLine('', 0, 'a', 'f')).toBeNull();
      });

      it('should handle single character line', () => {
        expect(findCharOnLine('a', 0, 'a', 'f')).toBeNull(); // can't find at current pos
        expect(findCharOnLine('a', 0, 'b', 'f')).toBeNull();
      });
    });
  });

  describe('getMotionTarget', () => {
    describe('h - move left', () => {
      it('should move left by one character', () => {
        const state = createState(['hello'], { line: 0, col: 3 });
        expect(getMotionTarget(state, 'h')).toEqual({ line: 0, col: 2 });
      });

      it('should stop at column 0', () => {
        const state = createState(['hello'], { line: 0, col: 0 });
        expect(getMotionTarget(state, 'h')).toEqual({ line: 0, col: 0 });
      });
    });

    describe('l - move right', () => {
      it('should move right by one character', () => {
        const state = createState(['hello'], { line: 0, col: 2 });
        expect(getMotionTarget(state, 'l')).toEqual({ line: 0, col: 3 });
      });

      it('should stop at end of line', () => {
        const state = createState(['hello'], { line: 0, col: 4 });
        expect(getMotionTarget(state, 'l')).toEqual({ line: 0, col: 4 });
      });

      it('should handle empty line', () => {
        const state = createState([''], { line: 0, col: 0 });
        // On empty line, cursor col should be -1 but gets clamped to 0
        const result = getMotionTarget(state, 'l');
        expect(result.col).toBeLessThanOrEqual(0);
      });
    });

    describe('j - move down', () => {
      it('should move down by one line', () => {
        const state = createState(['hello', 'world'], { line: 0, col: 2 });
        expect(getMotionTarget(state, 'j')).toEqual({ line: 1, col: 2 });
      });

      it('should adjust column if next line is shorter', () => {
        const state = createState(['hello', 'hi'], { line: 0, col: 4 });
        expect(getMotionTarget(state, 'j')).toEqual({ line: 1, col: 1 });
      });

      it('should stay at last line', () => {
        const state = createState(['hello', 'world'], { line: 1, col: 2 });
        expect(getMotionTarget(state, 'j')).toEqual({ line: 1, col: 2 });
      });

      it('should handle empty next line', () => {
        const state = createState(['hello', ''], { line: 0, col: 2 });
        expect(getMotionTarget(state, 'j')).toEqual({ line: 1, col: 0 });
      });
    });

    describe('k - move up', () => {
      it('should move up by one line', () => {
        const state = createState(['hello', 'world'], { line: 1, col: 2 });
        expect(getMotionTarget(state, 'k')).toEqual({ line: 0, col: 2 });
      });

      it('should adjust column if previous line is shorter', () => {
        const state = createState(['hi', 'hello'], { line: 1, col: 4 });
        expect(getMotionTarget(state, 'k')).toEqual({ line: 0, col: 1 });
      });

      it('should stay at first line', () => {
        const state = createState(['hello', 'world'], { line: 0, col: 2 });
        expect(getMotionTarget(state, 'k')).toEqual({ line: 0, col: 2 });
      });
    });

    describe('0 - move to line start', () => {
      it('should move to column 0', () => {
        const state = createState(['hello world'], { line: 0, col: 6 });
        expect(getMotionTarget(state, '0')).toEqual({ line: 0, col: 0 });
      });

      it('should stay at column 0', () => {
        const state = createState(['hello'], { line: 0, col: 0 });
        expect(getMotionTarget(state, '0')).toEqual({ line: 0, col: 0 });
      });
    });

    describe('$ - move to line end', () => {
      it('should move to last character', () => {
        const state = createState(['hello world'], { line: 0, col: 0 });
        expect(getMotionTarget(state, '$')).toEqual({ line: 0, col: 10 });
      });

      it('should handle empty line', () => {
        const state = createState([''], { line: 0, col: 0 });
        expect(getMotionTarget(state, '$')).toEqual({ line: 0, col: 0 });
      });

      it('should stay at end of line', () => {
        const state = createState(['hello'], { line: 0, col: 4 });
        expect(getMotionTarget(state, '$')).toEqual({ line: 0, col: 4 });
      });
    });

    describe('^ and _ - move to first non-blank', () => {
      it('should move to first non-whitespace character', () => {
        const state = createState(['  hello'], { line: 0, col: 6 });
        expect(getMotionTarget(state, '^')).toEqual({ line: 0, col: 2 });
        expect(getMotionTarget(state, '_')).toEqual({ line: 0, col: 2 });
      });

      it('should handle line with only whitespace', () => {
        const state = createState(['   '], { line: 0, col: 1 });
        expect(getMotionTarget(state, '^')).toEqual({ line: 0, col: 0 });
      });

      it('should handle line starting with non-whitespace', () => {
        const state = createState(['hello'], { line: 0, col: 3 });
        expect(getMotionTarget(state, '^')).toEqual({ line: 0, col: 0 });
      });
    });

    describe('w - move forward word', () => {
      it('should move to next word', () => {
        const state = createState(['hello world'], { line: 0, col: 0 });
        expect(getMotionTarget(state, 'w')).toEqual({ line: 0, col: 6 });
      });

      it('should skip multiple spaces', () => {
        const state = createState(['hello   world'], { line: 0, col: 0 });
        expect(getMotionTarget(state, 'w')).toEqual({ line: 0, col: 8 });
      });

      it('should treat punctuation as separate words', () => {
        const state = createState(['hello,world'], { line: 0, col: 0 });
        expect(getMotionTarget(state, 'w')).toEqual({ line: 0, col: 5 });
      });

      it('should move across lines', () => {
        const state = createState(['hello', 'world'], { line: 0, col: 0 });
        const target1 = getMotionTarget(state, 'w');
        expect(target1).toEqual({ line: 1, col: 0 });
      });

      it('should handle cursor at end of word', () => {
        const state = createState(['hello world'], { line: 0, col: 4 });
        expect(getMotionTarget(state, 'w')).toEqual({ line: 0, col: 6 });
      });

      it('should handle multiple punctuation', () => {
        const state = createState(['test...more'], { line: 0, col: 4 });
        const result = getMotionTarget(state, 'w');
        // w moves to start of next word/punctuation group
        expect(result.col).toBeGreaterThan(4);
      });
    });

    describe('b - move backward word', () => {
      it('should move to previous word', () => {
        const state = createState(['hello world'], { line: 0, col: 6 });
        expect(getMotionTarget(state, 'b')).toEqual({ line: 0, col: 0 });
      });

      it('should skip multiple spaces', () => {
        const state = createState(['hello   world'], { line: 0, col: 8 });
        expect(getMotionTarget(state, 'b')).toEqual({ line: 0, col: 0 });
      });

      it('should treat punctuation as separate words', () => {
        const state = createState(['hello,world'], { line: 0, col: 6 });
        expect(getMotionTarget(state, 'b')).toEqual({ line: 0, col: 5 });
      });

      it('should move across lines', () => {
        const state = createState(['hello', 'world'], { line: 1, col: 0 });
        expect(getMotionTarget(state, 'b')).toEqual({ line: 0, col: 0 });
      });

      it('should stop at line 0 col 0', () => {
        const state = createState(['hello'], { line: 0, col: 0 });
        expect(getMotionTarget(state, 'b')).toEqual({ line: 0, col: 0 });
      });
    });

    describe('e - move to word end', () => {
      it('should move to end of current word', () => {
        const state = createState(['hello world'], { line: 0, col: 0 });
        expect(getMotionTarget(state, 'e')).toEqual({ line: 0, col: 4 });
      });

      it('should move to end of next word if at end', () => {
        const state = createState(['hello world'], { line: 0, col: 4 });
        expect(getMotionTarget(state, 'e')).toEqual({ line: 0, col: 10 });
      });

      it('should skip whitespace', () => {
        const state = createState(['hello   world'], { line: 0, col: 4 });
        expect(getMotionTarget(state, 'e')).toEqual({ line: 0, col: 12 });
      });

      it('should treat punctuation separately', () => {
        const state = createState(['hello,world'], { line: 0, col: 0 });
        expect(getMotionTarget(state, 'e')).toEqual({ line: 0, col: 4 });
      });

      it('should handle cursor in whitespace', () => {
        const state = createState(['hello  world'], { line: 0, col: 5 });
        expect(getMotionTarget(state, 'e')).toEqual({ line: 0, col: 11 });
      });
    });

    describe('W - move forward WORD', () => {
      it('should treat punctuation as part of WORD', () => {
        const state = createState(['hello,world test'], { line: 0, col: 0 });
        expect(getMotionTarget(state, 'W')).toEqual({ line: 0, col: 12 });
      });

      it('should skip whitespace', () => {
        const state = createState(['hello   world'], { line: 0, col: 0 });
        expect(getMotionTarget(state, 'W')).toEqual({ line: 0, col: 8 });
      });

      it('should handle special characters as part of WORD', () => {
        const state = createState(['test@#$ more'], { line: 0, col: 0 });
        expect(getMotionTarget(state, 'W')).toEqual({ line: 0, col: 8 });
      });
    });

    describe('B - move backward WORD', () => {
      it('should treat punctuation as part of WORD', () => {
        const state = createState(['hello,world test'], { line: 0, col: 12 });
        expect(getMotionTarget(state, 'B')).toEqual({ line: 0, col: 0 });
      });

      it('should skip whitespace', () => {
        const state = createState(['hello   world'], { line: 0, col: 8 });
        expect(getMotionTarget(state, 'B')).toEqual({ line: 0, col: 0 });
      });
    });

    describe('E - move to WORD end', () => {
      it('should move to end of WORD including punctuation', () => {
        const state = createState(['hello,world test'], { line: 0, col: 0 });
        expect(getMotionTarget(state, 'E')).toEqual({ line: 0, col: 10 });
      });

      it('should skip whitespace', () => {
        const state = createState(['hello   world'], { line: 0, col: 4 });
        expect(getMotionTarget(state, 'E')).toEqual({ line: 0, col: 12 });
      });

      it('should handle special characters', () => {
        const state = createState(['test@#$ more'], { line: 0, col: 0 });
        expect(getMotionTarget(state, 'E')).toEqual({ line: 0, col: 6 });
      });
    });

    describe('edge cases', () => {
      it('should handle empty buffer', () => {
        const state = createState([''], { line: 0, col: 0 });
        expect(getMotionTarget(state, 'w')).toEqual({ line: 0, col: 0 });
        expect(getMotionTarget(state, 'b')).toEqual({ line: 0, col: 0 });
        expect(getMotionTarget(state, 'e')).toEqual({ line: 0, col: 0 });
      });

      it('should handle single character buffer', () => {
        const state = createState(['a'], { line: 0, col: 0 });
        expect(getMotionTarget(state, 'l')).toEqual({ line: 0, col: 0 });
        expect(getMotionTarget(state, 'h')).toEqual({ line: 0, col: 0 });
      });

      it('should handle buffer with only whitespace', () => {
        const state = createState(['   '], { line: 0, col: 0 });
        expect(getMotionTarget(state, 'w')).toEqual({ line: 0, col: 0 });
      });

      it('should handle multi-line buffer with empty lines', () => {
        const state = createState(['hello', '', 'world'], { line: 0, col: 0 });
        const target = getMotionTarget(state, 'w');
        expect(target.line).toBeGreaterThanOrEqual(0);
      });
    });
  });
});
