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

describe('Dot command (.) - repeat last change', () => {
  describe('single character edits', () => {
    it('should repeat delete character (x)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'x'); // delete 'h'
      expect(state.buffer[0]).toBe('ello');

      state = typeKeys(state, '.'); // repeat delete
      expect(state.buffer[0]).toBe('llo');
    });

    it('should repeat replace character (rx)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['aaaa'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'rx'); // replace 'a' with 'x'
      expect(state.buffer[0]).toBe('xaaa');

      state = typeKeys(state, 'l.'); // move right and repeat
      expect(state.buffer[0]).toBe('xxaa');

      state = typeKeys(state, 'l.'); // again
      expect(state.buffer[0]).toBe('xxxa');
    });

    it('should repeat substitute (s)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'sX<Esc>'); // substitute 'h' with 'X'
      expect(state.buffer[0]).toBe('Xello');

      state = typeKeys(state, 'l.'); // move and repeat
      expect(state.buffer[0]).toBe('XXllo');
    });
  });

  describe('delete operations', () => {
    it('should repeat delete word (dw)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['one two three'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'dw'); // delete 'one '
      expect(state.buffer[0]).toBe('two three');

      state = typeKeys(state, '.'); // delete 'two '
      expect(state.buffer[0]).toBe('three');
    });

    it('should repeat delete line (dd)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['line1', 'line2', 'line3'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'dd'); // delete line1
      expect(state.buffer).toEqual(['line2', 'line3']);

      state = typeKeys(state, '.'); // delete line2
      expect(state.buffer).toEqual(['line3']);
    });

    it('should repeat delete to end of line (d$)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello world', 'test line'], cursor: { line: 0, col: 6 } };
      state = typeKeys(state, 'd$'); // delete 'world'
      expect(state.buffer[0]).toBe('hello ');

      state = typeKeys(state, 'j0w.'); // go to next line, move to 'line', repeat d$
      expect(state.buffer[1]).toBe('test ');
    });

    it('should repeat delete backward (db)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello world test'], cursor: { line: 0, col: 6 } };
      state = typeKeys(state, 'db'); // delete 'hello '
      expect(state.buffer[0]).toBe('world test');

      state = typeKeys(state, 'w.'); // move to 'test', repeat db
      expect(state.buffer[0]).toBe('test');
    });
  });

  describe('insert operations', () => {
    it('should repeat insert (i)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['world'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'ihello <Esc>'); // insert 'hello '
      expect(state.buffer[0]).toBe('hello world');

      state = typeKeys(state, '$a!<Esc>'); // add '!' at end
      state = typeKeys(state, 'j.'); // move down (stays on same line) and repeat last insert
      // Last change was 'a!' so it should repeat that
      expect(state.buffer[0]).toBe('hello world!!');
    });

    it('should repeat insert at beginning (I)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['  hello', '  world'], cursor: { line: 0, col: 4 } };
      state = typeKeys(state, 'I> <Esc>'); // insert '> ' at first non-blank
      expect(state.buffer[0]).toBe('  > hello');

      state = typeKeys(state, 'j.'); // go down and repeat
      expect(state.buffer[1]).toBe('  > world');
    });

    it('should repeat append (a)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello', 'world'], cursor: { line: 0, col: 4 } };
      state = typeKeys(state, 'a!<Esc>'); // append '!'
      expect(state.buffer[0]).toBe('hello!');

      state = typeKeys(state, 'j$.'); // go to next line end and repeat
      expect(state.buffer[1]).toBe('world!');
    });

    it('should repeat append at end (A)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello', 'world'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'A!<Esc>'); // append '!' at end
      expect(state.buffer[0]).toBe('hello!');

      state = typeKeys(state, 'j.'); // go down and repeat
      expect(state.buffer[1]).toBe('world!');
    });

    it('should repeat open line below (o)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['line1', 'line3'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'oline2<Esc>'); // open line and type 'line2'
      expect(state.buffer).toEqual(['line1', 'line2', 'line3']);

      state = typeKeys(state, 'j.'); // go to line3 and repeat
      expect(state.buffer).toEqual(['line1', 'line2', 'line3', 'line2']);
    });

    it('should repeat open line above (O)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['line2'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'Oline1<Esc>'); // open line above and type 'line1'
      expect(state.buffer).toEqual(['line1', 'line2']);
      expect(state.cursor.line).toBe(0);

      state = typeKeys(state, 'j.'); // go to line2 and repeat
      expect(state.buffer).toEqual(['line1', 'line1', 'line2']);
    });

    it('should repeat complex insert with backspace', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['test'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'ihello<BS><BS>p <Esc>'); // type 'hello', backspace twice, type 'p '
      expect(state.buffer[0]).toBe('help test');

      state = typeKeys(state, '.'); // repeat
      expect(state.buffer[0]).toBe('help help test');
    });

    it('should repeat single-char insert with i', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['foo bar baz'], cursor: { line: 0, col: 4 } };
      state = typeKeys(state, 'iZ<Esc>');
      expect(state.buffer[0]).toBe('foo Zbar baz');
      expect(state.lastChange?.map(k => k.key)).toEqual(['i', 'Z', 'Escape']);
      expect(state.lastChangeCount).toBe(1);

      state = pressKey(state, '.');
      expect(state.buffer[0]).toBe('foo ZZbar baz');
    });
  });

  describe('change operations', () => {
    it('should repeat change word (cw)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['foo bar baz'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'cwhello<Esc>'); // change 'foo' to 'hello' (keep space)
      expect(state.buffer[0]).toBe('hello bar baz');

      state = typeKeys(state, 'w.'); // move to 'bar' and repeat
      expect(state.buffer[0]).toBe('hello hello baz');
    });

    it('should move to next word when repeating cw from indentation', () => {
      let state = {
        ...INITIAL_VIM_STATE,
        buffer: ['    int first;', '    int second;'],
        cursor: { line: 0, col: 4 }
      };
      state = typeKeys(state, 'cwx<Esc>'); // change first int to x
      expect(state.buffer[0]).toBe('    x first;');

      state = typeKeys(state, 'j.'); // cursor on indentation, dot should target next word
      expect(state.buffer[1]).toBe('    x second;');
    });

    it('should repeat change to end (c$)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello world', 'test line'], cursor: { line: 0, col: 6 } };
      state = typeKeys(state, 'c$END<Esc>'); // change 'world' to 'END'
      expect(state.buffer[0]).toBe('hello END');

      state = typeKeys(state, 'jw.'); // go to 'line' and repeat
      expect(state.buffer[1]).toBe('test END');
    });

    it('should repeat change with motion (cb)', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello world test'], cursor: { line: 0, col: 12 } };
      state = typeKeys(state, 'cbNEW <Esc>'); // change backward 'world ' to 'NEW '
      expect(state.buffer[0]).toBe('hello NEW test');

      state = typeKeys(state, 'b.'); // move back and repeat
      expect(state.buffer[0]).toBe('NEW NEW test');
    });
  });

  describe('count prefix with dot', () => {
    it('should use original count when no new count given', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, '3x'); // delete 3 chars
      expect(state.buffer[0]).toBe('lo');

      state = typeKeys(state, '.'); // repeat (should delete 3 more, but only 2 left)
      expect(state.buffer[0]).toBe('');
    });

    it('should override count when new count given', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['abcdefgh'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, '3x'); // delete 3 chars
      expect(state.buffer[0]).toBe('defgh');

      state = typeKeys(state, '2.'); // repeat with count 2
      expect(state.buffer[0]).toBe('h');
    });

    it('should repeat insert operation with count', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: [''], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'i*<Esc>'); // insert '*'
      expect(state.buffer[0]).toBe('*');

      state = typeKeys(state, '3.'); // repeat 3 times
      expect(state.buffer[0]).toBe('****');
    });

    it('should repeat delete with different counts', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['line1', 'line2', 'line3', 'line4', 'line5'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, '2dd'); // delete 2 lines
      expect(state.buffer).toEqual(['line3', 'line4', 'line5']);

      state = typeKeys(state, '.'); // repeat (delete 2 more)
      expect(state.buffer).toEqual(['line5']);
    });
  });

  describe('interactions with other commands', () => {
    it('should not repeat yank operations', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello world'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'yw'); // yank word
      expect(state.register).toBe('hello ');

      const lastChange = state.lastChange;
      state = typeKeys(state, '.'); // dot after yank should do nothing (yank is not a change)
      expect(state.lastChange).toBe(lastChange); // lastChange should not be updated
    });

    it('should not repeat movements', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello world'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'iwow <Esc>'); // insert 'wow '
      expect(state.buffer[0]).toBe('wow hello world');

      state = typeKeys(state, 'w'); // move word (should not affect lastChange)
      state = typeKeys(state, '.'); // should repeat insert, not movement
      expect(state.buffer[0]).toBe('wow wow hello world');
    });

    it('should repeat paste operations', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'yw'); // yank
      state = typeKeys(state, 'ix<Esc>'); // insert 'x' (this is the last change)
      state = typeKeys(state, 'p'); // paste (last change becomes paste)
      state = typeKeys(state, '.'); // dot should repeat the paste

      expect(state.buffer[0]).toBe('xhellohellohello');
    });

    it('should work after undo', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello world'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'dw'); // delete word
      expect(state.buffer[0]).toBe('world');

      state = typeKeys(state, 'u'); // undo
      expect(state.buffer[0]).toBe('hello world');

      state = typeKeys(state, '.'); // repeat delete (lastChange should still be 'dw')
      expect(state.buffer[0]).toBe('world');
    });
  });

  describe('edge cases', () => {
    it('should do nothing when no change has been made', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, '.'); // no previous change

      expect(state.buffer).toEqual(['hello']); // no change
    });

    it('should handle dot at end of line', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'x'); // delete 'h'
      expect(state.buffer[0]).toBe('ello');

      state = typeKeys(state, '$'); // move to end
      state = typeKeys(state, '.'); // repeat delete at end
      expect(state.buffer[0]).toBe('ell');
    });

    it('should handle dot with empty buffer', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: [''], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'ihello<Esc>');
      state = typeKeys(state, 'dd'); // delete the line
      expect(state.buffer).toEqual(['']); // buffer can't be empty

      state = typeKeys(state, '.'); // repeat delete on empty buffer
      expect(state.buffer).toEqual(['']); // should handle gracefully
    });

    it('should preserve lastChange through mode switches', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'x'); // delete 'h'
      expect(state.buffer[0]).toBe('ello');

      state = typeKeys(state, 'i'); // enter insert mode
      state = typeKeys(state, '<Esc>'); // exit without typing

      state = typeKeys(state, '.'); // should still repeat 'x'
      expect(state.buffer[0]).toBe('llo');
    });

    it('should handle very long insert sequences', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: [''], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'iabcdefghijklmnopqrstuvwxyz<Esc>');
      expect(state.buffer[0]).toBe('abcdefghijklmnopqrstuvwxyz');

      state = typeKeys(state, '.'); // repeat long insert
      expect(state.buffer[0]).toBe('abcdefghijklmnopqrstuvwxyabcdefghijklmnopqrstuvwxyzz');
    });
  });

  describe('multi-step changes', () => {
    it('should only repeat the last change, not all changes', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['hello world'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'dw'); // delete 'hello '
      expect(state.buffer[0]).toBe('world');

      state = typeKeys(state, 'ia <Esc>'); // insert 'a '
      expect(state.buffer[0]).toBe('a world');

      state = typeKeys(state, '.'); // should repeat 'ia ', not 'dw'
      expect(state.buffer[0]).toBe('a a world');
    });

    it('should handle change followed by movement and dot', () => {
      let state = { ...INITIAL_VIM_STATE, buffer: ['foo bar baz'], cursor: { line: 0, col: 0 } };
      state = typeKeys(state, 'cwhello<Esc>'); // change 'foo' to 'hello' (keep space)
      expect(state.buffer[0]).toBe('hello bar baz');

      state = typeKeys(state, '0w'); // move to 'bar'
      state = typeKeys(state, '.'); // repeat change
      expect(state.buffer[0]).toBe('hello hello baz');
    });
  });
});
