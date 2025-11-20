import type { VimState, VimAction, Motion, Operator } from './types';
import { getMotionTarget } from './motions';
import { applyOperatorWithMotion } from './operators';

export const INITIAL_VIM_STATE: VimState = {
  buffer: [''],
  cursor: { line: 0, col: 0 },
  mode: 'normal',
  pendingOperator: null,
  pendingReplace: false,
  lastCommand: null,
};

export const vimReducer = (state: VimState, action: VimAction): VimState => {
  const { type, payload } = action;
  const { buffer, cursor, mode, pendingOperator, pendingReplace } = state;

  if (!buffer.length) return { ...state, buffer: [''] };

  switch (type) {
    case 'RESET':
      return { ...INITIAL_VIM_STATE, ...payload };

    case 'KEYDOWN': {
      const { key, ctrlKey } = payload;

      // INSERT MODE
      if (mode === 'insert') {
        if (key === 'Escape') {
          return {
            ...state,
            mode: 'normal',
            cursor: { ...cursor, col: Math.max(0, cursor.col - 1) },
            lastCommand: { type: 'mode-switch', to: 'normal' }
          };
        }

        if (key === 'Backspace') {
          const lineText = buffer[cursor.line];
          if (cursor.col > 0) {
            const newLine = lineText.slice(0, cursor.col - 1) + lineText.slice(cursor.col);
            const newBuffer = [...buffer];
            newBuffer[cursor.line] = newLine;
            return { ...state, buffer: newBuffer, cursor: { ...cursor, col: cursor.col - 1 } };
          } else if (cursor.line > 0) {
            const prevLine = buffer[cursor.line - 1];
            const newBuffer = [...buffer];
            newBuffer[cursor.line - 1] = prevLine + lineText;
            newBuffer.splice(cursor.line, 1);
            return { ...state, buffer: newBuffer, cursor: { line: cursor.line - 1, col: prevLine.length } };
          }
          return state;
        }

        if (key === 'Enter') {
          const lineText = buffer[cursor.line];
          const before = lineText.slice(0, cursor.col);
          const after = lineText.slice(cursor.col);
          const newBuffer = [...buffer];
          newBuffer[cursor.line] = before;
          newBuffer.splice(cursor.line + 1, 0, after);
          return { ...state, buffer: newBuffer, cursor: { line: cursor.line + 1, col: 0 } };
        }

        if (key.length === 1 && !ctrlKey) {
          const lineText = buffer[cursor.line];
          const newLine = lineText.slice(0, cursor.col) + key + lineText.slice(cursor.col);
          const newBuffer = [...buffer];
          newBuffer[cursor.line] = newLine;
          return { ...state, buffer: newBuffer, cursor: { ...cursor, col: cursor.col + 1 } };
        }

        return state;
      }

      // NORMAL MODE
      if (mode === 'normal') {
        if (key === 'Escape') {
          return { ...state, pendingOperator: null, pendingReplace: false };
        }

        // Handle pending replace
        if (pendingReplace) {
          if (key.length === 1 && !ctrlKey) {
            const lineText = buffer[cursor.line];
            if (cursor.col < lineText.length) {
              const newLine = lineText.slice(0, cursor.col) + key + lineText.slice(cursor.col + 1);
              const newBuffer = [...buffer];
              newBuffer[cursor.line] = newLine;
              return {
                ...state,
                buffer: newBuffer,
                pendingReplace: false,
                lastCommand: { type: 'delete-char' }
              };
            }
          }
          return { ...state, pendingReplace: false };
        }

        // Handle Pending Operator
        if (pendingOperator) {
          // dd - Delete line
          if (pendingOperator === 'd' && key === 'd') {
            const newBuffer = [...buffer];
            newBuffer.splice(cursor.line, 1);
            if (newBuffer.length === 0) newBuffer.push('');
            let newLineIdx = cursor.line;
            if (newLineIdx >= newBuffer.length) newLineIdx = newBuffer.length - 1;

            return {
              ...state,
              buffer: newBuffer,
              cursor: { line: newLineIdx, col: 0 },
              pendingOperator: null,
              lastCommand: { type: 'delete-line' }
            };
          }

          // Operator + Motion
          if (['h', 'j', 'k', 'l', 'w', 'b', 'e', '0', '$', '^', 'W', 'B', 'E'].includes(key)) {
            if (pendingOperator === 'd' || pendingOperator === 'c') {
              return applyOperatorWithMotion(state, pendingOperator, key as Motion);
            }
          }

          return { ...state, pendingOperator: null };
        }

        // Navigation
        if (['h', 'j', 'k', 'l', 'w', 'b', 'e', '0', '$', '^', 'W', 'B', 'E'].includes(key)) {
          const newPos = getMotionTarget(state, key as Motion);
          return { ...state, cursor: newPos, lastCommand: { type: 'move', motion: key as Motion } };
        }

        // Operators
        if (key === 'd') return { ...state, pendingOperator: 'd' };
        if (key === 'c') return { ...state, pendingOperator: 'c' };

        // Delete char
        if (key === 'x') {
          const lineText = buffer[cursor.line];
          if (lineText.length > 0) {
            const newLine = lineText.slice(0, cursor.col) + lineText.slice(cursor.col + 1);
            const newBuffer = [...buffer];
            newBuffer[cursor.line] = newLine;
            let newCol = cursor.col;
            if (newCol >= newLine.length) newCol = Math.max(0, newLine.length - 1);

            return {
              ...state,
              buffer: newBuffer,
              cursor: { ...cursor, col: newCol },
              lastCommand: { type: 'delete-char' }
            };
          }
          return state;
        }

        // Substitute char (delete and enter insert)
        if (key === 's') {
          const lineText = buffer[cursor.line];
          if (lineText.length > 0) {
            const newLine = lineText.slice(0, cursor.col) + lineText.slice(cursor.col + 1);
            const newBuffer = [...buffer];
            newBuffer[cursor.line] = newLine;
            return {
              ...state,
              mode: 'insert',
              buffer: newBuffer,
              lastCommand: { type: 'delete-char' }
            };
          }
          return { ...state, mode: 'insert', lastCommand: { type: 'enter-insert' } };
        }

        // Replace char
        if (key === 'r') {
          return { ...state, pendingReplace: true };
        }

        // Mode Switching
        if (key === 'i') return { ...state, mode: 'insert', lastCommand: { type: 'enter-insert' } };
        if (key === 'I') {
          const lineText = buffer[cursor.line];
          let col = lineText.search(/\S/);
          if (col === -1) col = lineText.length;
          return { ...state, mode: 'insert', cursor: { ...cursor, col }, lastCommand: { type: 'enter-insert' } };
        }
        if (key === 'a') {
          return {
            ...state,
            mode: 'insert',
            cursor: { ...cursor, col: Math.min(buffer[cursor.line].length, cursor.col + 1) },
            lastCommand: { type: 'enter-insert' }
          };
        }
        if (key === 'A') {
          return {
            ...state,
            mode: 'insert',
            cursor: { ...cursor, col: buffer[cursor.line].length },
            lastCommand: { type: 'enter-insert' }
          };
        }
        if (key === 'o') {
          const newBuffer = [...buffer];
          newBuffer.splice(cursor.line + 1, 0, '');
          return {
            ...state,
            mode: 'insert',
            buffer: newBuffer,
            cursor: { line: cursor.line + 1, col: 0 },
            lastCommand: { type: 'open-line' }
          };
        }
        if (key === 'O') {
          const newBuffer = [...buffer];
          newBuffer.splice(cursor.line, 0, '');
          return {
            ...state,
            mode: 'insert',
            buffer: newBuffer,
            cursor: { line: cursor.line, col: 0 },
            lastCommand: { type: 'open-line-above' }
          };
        }

        return state;
      }

      return state;
    }

    default:
      return state;
  }
};
