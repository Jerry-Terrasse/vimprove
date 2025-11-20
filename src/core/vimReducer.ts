import type { VimState, VimAction, Motion, Operator } from './types';
import { getMotionTarget, findCharOnLine } from './motions';
import { applyOperatorWithMotion } from './operators';

// Helper: get count value (default 1)
const getCount = (state: VimState): number => {
  const count = parseInt(state.count) || 1;
  return Math.max(1, Math.min(count, 999)); // Limit to 1-999
};

// Helper: create snapshot for history (without history/historyIndex to avoid circular refs)
const createSnapshot = (state: VimState): VimState => {
  return {
    buffer: [...state.buffer],
    cursor: { ...state.cursor },
    mode: state.mode,
    pendingOperator: state.pendingOperator,
    pendingReplace: state.pendingReplace,
    pendingFind: state.pendingFind,
    lastCommand: state.lastCommand,
    history: [],
    historyIndex: -1,
    register: state.register,
    count: state.count,
    lastFind: state.lastFind,
    lastChange: state.lastChange,
  };
};

// Helper: add current state to history before making changes
const pushHistory = (state: VimState): VimState => {
  const snapshot = createSnapshot(state);
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(snapshot);

  // Limit history size
  const maxHistory = 100;
  if (newHistory.length > maxHistory) {
    newHistory.shift();
  }

  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
};

export const INITIAL_VIM_STATE: VimState = {
  buffer: [''],
  cursor: { line: 0, col: 0 },
  mode: 'normal',
  pendingOperator: null,
  pendingReplace: false,
  pendingFind: null,
  lastCommand: null,
  history: [],
  historyIndex: -1,
  register: '',
  count: '',
  lastFind: null,
  lastChange: null,
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
          return { ...state, pendingOperator: null, pendingReplace: false, pendingFind: null, count: '' };
        }

        // Handle pending find
        if (state.pendingFind) {
          if (key.length === 1 && !ctrlKey) {
            const lineText = buffer[cursor.line];
            const newCol = findCharOnLine(lineText, cursor.col, key, state.pendingFind);

            if (newCol !== null) {
              return {
                ...state,
                cursor: { ...cursor, col: newCol },
                pendingFind: null,
                lastFind: { type: state.pendingFind, char: key },
                count: '',
                lastCommand: { type: 'move' }
              };
            }
          }
          return { ...state, pendingFind: null, count: '' };
        }

        // Capture count prefix (1-9)
        if (!pendingOperator && !pendingReplace && !state.pendingFind && /^[1-9]$/.test(key)) {
          return { ...state, count: state.count + key };
        }

        // Undo
        if (key === 'u' && !ctrlKey) {
          if (state.historyIndex >= 0) {
            const prevState = state.history[state.historyIndex];
            return {
              ...prevState,
              history: state.history,
              historyIndex: state.historyIndex - 1,
            };
          }
          return state;
        }

        // Redo (Ctrl-r)
        if (key === 'r' && ctrlKey) {
          if (state.historyIndex < state.history.length - 1) {
            const nextState = state.history[state.historyIndex + 1];
            return {
              ...nextState,
              history: state.history,
              historyIndex: state.historyIndex + 1,
            };
          }
          return state;
        }

        // Handle pending replace
        if (pendingReplace) {
          if (key.length === 1 && !ctrlKey) {
            const lineText = buffer[cursor.line];
            if (cursor.col < lineText.length) {
              const stateWithHistory = pushHistory(state);
              const newLine = lineText.slice(0, cursor.col) + key + lineText.slice(cursor.col + 1);
              const newBuffer = [...buffer];
              newBuffer[cursor.line] = newLine;
              return {
                ...stateWithHistory,
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
          // dd/yy - Delete/Yank line(s)
          if ((pendingOperator === 'd' || pendingOperator === 'y') && key === pendingOperator) {
            const count = getCount(state);
            const startLine = cursor.line;
            const endLine = Math.min(cursor.line + count - 1, buffer.length - 1);
            const linesToProcess = buffer.slice(startLine, endLine + 1);
            const yankedText = linesToProcess.join('\n') + '\n';

            if (pendingOperator === 'y') {
              // yy - Yank line(s)
              return {
                ...state,
                register: yankedText,
                pendingOperator: null,
                count: '',
                lastCommand: { type: 'custom' as any }
              };
            } else {
              // dd - Delete line(s)
              const stateWithHistory = pushHistory(state);
              const newBuffer = [...buffer];
              newBuffer.splice(startLine, endLine - startLine + 1);
              if (newBuffer.length === 0) newBuffer.push('');
              let newLineIdx = startLine;
              if (newLineIdx >= newBuffer.length) newLineIdx = newBuffer.length - 1;

              return {
                ...stateWithHistory,
                buffer: newBuffer,
                cursor: { line: newLineIdx, col: 0 },
                pendingOperator: null,
                register: yankedText,
                count: '',
                lastCommand: { type: 'delete-line' }
              };
            }
          }

          // Operator + Motion
          if (['h', 'j', 'k', 'l', 'w', 'b', 'e', '0', '$', '^', '_', 'W', 'B', 'E'].includes(key)) {
            if (pendingOperator === 'd' || pendingOperator === 'c' || pendingOperator === 'y') {
              const count = getCount(state);
              let resultState = state;

              // Apply operator+motion count times
              for (let i = 0; i < count; i++) {
                resultState = applyOperatorWithMotion(resultState, pendingOperator, key as Motion);
                // For yank, don't repeat (first yank is enough)
                if (pendingOperator === 'y') break;
              }

              return { ...resultState, count: '' };
            }
          }

          return { ...state, pendingOperator: null, count: '' };
        }

        // Navigation
        if (['h', 'j', 'k', 'l', 'w', 'b', 'e', '0', '$', '^', '_', 'W', 'B', 'E'].includes(key)) {
          const count = getCount(state);
          let newPos = state.cursor;
          let tempState = state;

          // Repeat motion count times
          for (let i = 0; i < count; i++) {
            newPos = getMotionTarget(tempState, key as Motion);
            tempState = { ...tempState, cursor: newPos };
          }

          return { ...state, cursor: newPos, count: '', lastCommand: { type: 'move', motion: key as Motion } };
        }

        // Find commands
        if (['f', 'F', 't', 'T'].includes(key)) {
          return { ...state, pendingFind: key as 'f' | 'F' | 't' | 'T' };
        }

        // Repeat find (;)
        if (key === ';' && state.lastFind) {
          const lineText = buffer[cursor.line];
          const newCol = findCharOnLine(lineText, cursor.col, state.lastFind.char, state.lastFind.type);

          if (newCol !== null) {
            return {
              ...state,
              cursor: { ...cursor, col: newCol },
              count: '',
              lastCommand: { type: 'move' }
            };
          }
          return state;
        }

        // Reverse find (,)
        if (key === ',' && state.lastFind) {
          const lineText = buffer[cursor.line];
          // Reverse the find type
          const reverseType: Record<string, 'f' | 'F' | 't' | 'T'> = {
            'f': 'F',
            'F': 'f',
            't': 'T',
            'T': 't'
          };
          const reversedFindType = reverseType[state.lastFind.type];
          const newCol = findCharOnLine(lineText, cursor.col, state.lastFind.char, reversedFindType);

          if (newCol !== null) {
            return {
              ...state,
              cursor: { ...cursor, col: newCol },
              count: '',
              lastCommand: { type: 'move' }
            };
          }
          return state;
        }

        // Operators
        if (key === 'd') return { ...state, pendingOperator: 'd' };
        if (key === 'c') return { ...state, pendingOperator: 'c' };
        if (key === 'y') return { ...state, pendingOperator: 'y' };

        // Paste
        if (key === 'p') {
          if (state.register) {
            const stateWithHistory = pushHistory(state);
            const isLinewise = state.register.endsWith('\n');

            if (isLinewise) {
              // Line-wise paste: insert after current line
              const content = state.register.slice(0, -1); // Remove trailing newline
              const newBuffer = [...buffer];
              newBuffer.splice(cursor.line + 1, 0, content);
              return {
                ...stateWithHistory,
                buffer: newBuffer,
                cursor: { line: cursor.line + 1, col: 0 },
                lastCommand: { type: 'custom' as any }
              };
            } else {
              // Character-wise paste: insert after cursor
              const lineText = buffer[cursor.line];
              const insertCol = Math.min(cursor.col + 1, lineText.length);
              const newLine = lineText.slice(0, insertCol) + state.register + lineText.slice(insertCol);
              const newBuffer = [...buffer];
              newBuffer[cursor.line] = newLine;
              return {
                ...stateWithHistory,
                buffer: newBuffer,
                cursor: { ...cursor, col: insertCol + state.register.length - 1 },
                lastCommand: { type: 'custom' as any }
              };
            }
          }
          return state;
        }

        if (key === 'P') {
          if (state.register) {
            const stateWithHistory = pushHistory(state);
            const isLinewise = state.register.endsWith('\n');

            if (isLinewise) {
              // Line-wise paste: insert before current line
              const content = state.register.slice(0, -1); // Remove trailing newline
              const newBuffer = [...buffer];
              newBuffer.splice(cursor.line, 0, content);
              return {
                ...stateWithHistory,
                buffer: newBuffer,
                cursor: { line: cursor.line, col: 0 },
                lastCommand: { type: 'custom' as any }
              };
            } else {
              // Character-wise paste: insert before cursor
              const lineText = buffer[cursor.line];
              const newLine = lineText.slice(0, cursor.col) + state.register + lineText.slice(cursor.col);
              const newBuffer = [...buffer];
              newBuffer[cursor.line] = newLine;
              return {
                ...stateWithHistory,
                buffer: newBuffer,
                cursor: { ...cursor, col: cursor.col + state.register.length - 1 },
                lastCommand: { type: 'custom' as any }
              };
            }
          }
          return state;
        }

        // Delete char
        if (key === 'x') {
          const lineText = buffer[cursor.line];
          if (lineText.length > 0) {
            const stateWithHistory = pushHistory(state);
            const newLine = lineText.slice(0, cursor.col) + lineText.slice(cursor.col + 1);
            const newBuffer = [...buffer];
            newBuffer[cursor.line] = newLine;
            let newCol = cursor.col;
            if (newCol >= newLine.length) newCol = Math.max(0, newLine.length - 1);

            return {
              ...stateWithHistory,
              buffer: newBuffer,
              cursor: { ...cursor, col: newCol },
              lastCommand: { type: 'delete-char' }
            };
          }
          return state;
        }

        // Substitute char (delete and enter insert)
        if (key === 's') {
          const stateWithHistory = pushHistory(state);
          const lineText = buffer[cursor.line];
          if (lineText.length > 0) {
            const newLine = lineText.slice(0, cursor.col) + lineText.slice(cursor.col + 1);
            const newBuffer = [...buffer];
            newBuffer[cursor.line] = newLine;
            return {
              ...stateWithHistory,
              mode: 'insert',
              buffer: newBuffer,
              lastCommand: { type: 'delete-char' }
            };
          }
          return { ...stateWithHistory, mode: 'insert', lastCommand: { type: 'enter-insert' } };
        }

        // Replace char
        if (key === 'r') {
          return { ...state, pendingReplace: true };
        }

        // Mode Switching
        if (key === 'i') {
          const stateWithHistory = pushHistory(state);
          return { ...stateWithHistory, mode: 'insert', lastCommand: { type: 'enter-insert' } };
        }
        if (key === 'I') {
          const stateWithHistory = pushHistory(state);
          const lineText = buffer[cursor.line];
          let col = lineText.search(/\S/);
          if (col === -1) col = lineText.length;
          return { ...stateWithHistory, mode: 'insert', cursor: { ...cursor, col }, lastCommand: { type: 'enter-insert' } };
        }
        if (key === 'a') {
          const stateWithHistory = pushHistory(state);
          return {
            ...stateWithHistory,
            mode: 'insert',
            cursor: { ...cursor, col: Math.min(buffer[cursor.line].length, cursor.col + 1) },
            lastCommand: { type: 'enter-insert' }
          };
        }
        if (key === 'A') {
          const stateWithHistory = pushHistory(state);
          return {
            ...stateWithHistory,
            mode: 'insert',
            cursor: { ...cursor, col: buffer[cursor.line].length },
            lastCommand: { type: 'enter-insert' }
          };
        }
        if (key === 'o') {
          const stateWithHistory = pushHistory(state);
          const newBuffer = [...buffer];
          newBuffer.splice(cursor.line + 1, 0, '');
          return {
            ...stateWithHistory,
            mode: 'insert',
            buffer: newBuffer,
            cursor: { line: cursor.line + 1, col: 0 },
            lastCommand: { type: 'open-line' }
          };
        }
        if (key === 'O') {
          const stateWithHistory = pushHistory(state);
          const newBuffer = [...buffer];
          newBuffer.splice(cursor.line, 0, '');
          return {
            ...stateWithHistory,
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
