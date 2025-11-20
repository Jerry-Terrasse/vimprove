import type { VimState, VimAction, Motion, KeyPress, Operator, OperatorMotion, TextObject } from './types';
import { getMotionTarget, findCharOnLine } from './motions';
import { applyOperatorWithMotion } from './operators';
import { isWhitespace, isWordChar } from './utils';

// Helper: get count value (default 1)
const getCount = (state: VimState): number => {
  const count = parseInt(state.count) || 1;
  return Math.max(1, Math.min(count, 999)); // Limit to 1-999
};

const buildTextObjectMotion = (prefix: 'i' | 'a', key: string): TextObject | null => {
  const mapping: Record<string, string> = {
    'w': 'w',
    'p': 'p',
    '(': '(',
    ')': '(',
    '{': '{',
    '}': '{',
    '[': '[',
    ']': '[',
    '"': '"',
    "'": "'",
    '`': '`'
  };
  const mapped = mapping[key];
  if (!mapped) return null;
  return `${prefix}${mapped}` as TextObject;
};

const findPatternFromCursor = (
  buffer: string[],
  pattern: string,
  cursor: { line: number; col: number },
  direction: 'forward' | 'backward'
): { line: number; col: number } | null => {
  if (!pattern) return null;

  if (direction === 'forward') {
    for (let line = cursor.line; line < buffer.length; line++) {
      const lineText = buffer[line];
      const startCol = line === cursor.line ? cursor.col + 1 : 0;
      const idx = lineText.indexOf(pattern, startCol);
      if (idx !== -1) return { line, col: idx };
    }
  } else {
    for (let line = cursor.line; line >= 0; line--) {
      const lineText = buffer[line];
      const startCol = line === cursor.line ? Math.max(0, cursor.col - 1) : lineText.length - 1;
      if (startCol < 0) continue;
      const segment = lineText.slice(0, startCol + 1);
      const idx = segment.lastIndexOf(pattern);
      if (idx !== -1) return { line, col: idx };
    }
  }

  return null;
};

const getWordUnderCursor = (buffer: string[], cursor: { line: number; col: number }): { word: string; startCol: number } | null => {
  const lineText = buffer[cursor.line] ?? '';
  if (!lineText.length) return null;
  let idx = Math.min(cursor.col, Math.max(0, lineText.length - 1));

  if (isWhitespace(lineText[idx])) return null;

  const targetIsWord = isWordChar(lineText[idx]);
  let start = idx;
  while (start > 0) {
    const char = lineText[start - 1];
    if (isWhitespace(char)) break;
    const charIsWord = isWordChar(char);
    if (charIsWord !== targetIsWord) break;
    start--;
  }

  let end = idx;
  while (end < lineText.length) {
    const char = lineText[end];
    if (isWhitespace(char)) break;
    const charIsWord = isWordChar(char);
    if (charIsWord !== targetIsWord) break;
    end++;
  }

  const word = lineText.slice(start, end);
  if (!word.length) return null;
  return { word, startCol: start };
};

// Helper: find the start of the current word (or last non-whitespace run) from a column
const findWordStart = (line: string, col: number): number => {
  if (!line.length) return 0;
  let idx = Math.min(col, Math.max(0, line.length - 1));
  // If we're on whitespace, move left to the previous non-whitespace (if any)
  while (idx > 0 && isWhitespace(line[idx])) {
    idx--;
  }
  while (idx > 0 && !isWhitespace(line[idx - 1])) {
    idx--;
  }
  return idx;
};

// Helper: start recording a change
const startRecording = (state: VimState, key: string, ctrlKey: boolean): VimState => {
  const recording: KeyPress[] = [{ key, ctrlKey }];
  return {
    ...state,
    changeRecording: recording,
    recordingCount: getCount(state),
    recordingExitCursor: null,
    recordingInsertCursor: null,
  };
};

// Helper: record a key during change
const recordKey = (state: VimState, key: string, ctrlKey: boolean): VimState => {
  if (!state.changeRecording) return state;
  return {
    ...state,
    changeRecording: [...state.changeRecording, { key, ctrlKey }],
  };
};

// Helper: finish recording and save to lastChange
const finishRecording = (state: VimState): VimState => {
  if (!state.changeRecording) return state;
  const exitCursor = state.recordingExitCursor ?? state.cursor;
  const insertCursor = state.recordingInsertCursor ?? state.cursor;
  return {
    ...state,
    lastChange: state.changeRecording,
    lastChangeCount: state.recordingCount ?? 1,
    changeRecording: null,
    recordingCount: null,
    lastChangeCursor: exitCursor,
    lastChangeInsertCursor: insertCursor,
    recordingExitCursor: null,
    recordingInsertCursor: null,
  };
};

const applyOperatorMotion = (state: VimState, operator: Operator, motion: OperatorMotion): VimState => {
  const count = getCount(state);
  let resultState = state;
  for (let i = 0; i < count; i++) {
    resultState = applyOperatorWithMotion(resultState, operator, motion);
    if (operator === 'y') break;
  }

  if (operator === 'd') {
    resultState = finishRecording(resultState);
  } else if (operator === 'y') {
    resultState = { ...resultState, changeRecording: null, recordingCount: null };
  }

  return { ...resultState, count: '', pendingTextObject: null };
};

// Helper: replay keys for . command
const replayKeys = (state: VimState, keys: KeyPress[], countForChange: number): VimState => {
  let currentState = { ...state, count: countForChange > 1 ? String(countForChange) : '' };
  for (const keyPress of keys) {
    // Temporarily disable recording during replay to avoid infinite loops
    const tempState = {
      ...currentState,
      changeRecording: null,
      recordingCount: null,
      recordingExitCursor: null,
      recordingInsertCursor: null
    };
    currentState = vimReducer(tempState, {
      type: 'KEYDOWN',
      payload: { key: keyPress.key, ctrlKey: keyPress.ctrlKey },
    });
    // Preserve the lastChange from before replay
    currentState = {
      ...currentState,
      lastChange: state.lastChange,
      lastChangeCount: state.lastChangeCount
    };
  }
  return currentState;
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
    pendingTextObject: state.pendingTextObject,
    pendingSearch: state.pendingSearch,
    lastSearch: state.lastSearch,
    lastCommand: state.lastCommand,
    history: [],
    historyIndex: -1,
    register: state.register,
    count: state.count,
    lastFind: state.lastFind,
    lastChange: state.lastChange ? [...state.lastChange] : null,
    changeRecording: state.changeRecording ? [...state.changeRecording] : null,
    lastChangeCount: state.lastChangeCount,
    recordingCount: state.recordingCount,
    lastChangeCursor: state.lastChangeCursor ? { ...state.lastChangeCursor } : null,
    lastChangeInsertCursor: state.lastChangeInsertCursor ? { ...state.lastChangeInsertCursor } : null,
    recordingExitCursor: state.recordingExitCursor ? { ...state.recordingExitCursor } : null,
    recordingInsertCursor: state.recordingInsertCursor ? { ...state.recordingInsertCursor } : null,
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
  pendingTextObject: null,
  pendingSearch: null,
  lastSearch: null,
  lastCommand: null,
  history: [],
  historyIndex: -1,
  register: '',
  count: '',
  lastFind: null,
  lastChange: null,
  changeRecording: null,
  lastChangeCount: null,
  recordingCount: null,
  lastChangeCursor: null,
  lastChangeInsertCursor: null,
  recordingExitCursor: null,
  recordingInsertCursor: null,
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
          // Finish recording when exiting insert mode (only if buffer actually changed)
          const latestSnapshot = state.history[state.historyIndex];
          const hasBufferChanged = latestSnapshot
            ? latestSnapshot.buffer.length !== buffer.length || latestSnapshot.buffer.some((line, idx) => line !== buffer[idx])
            : true;
          const stateToFinish = hasBufferChanged && state.changeRecording
            ? recordKey(state, key, ctrlKey || false)
            : state;
          const exitCursor = { ...cursor, col: Math.max(0, cursor.col - 1) };
          const stateWithCursors = {
            ...stateToFinish,
            recordingExitCursor: exitCursor,
            recordingInsertCursor: cursor
          };
          const stateAfterRecording = hasBufferChanged
            ? finishRecording(stateWithCursors)
            : { ...state, changeRecording: null, recordingCount: null, recordingExitCursor: null, recordingInsertCursor: null };
          return {
            ...stateAfterRecording,
            mode: 'normal',
            cursor: exitCursor,
            lastCommand: { type: 'mode-switch', to: 'normal' }
          };
        }

        // Record all keys in insert mode
        const stateAfterRecord = recordKey(state, key, ctrlKey || false);

        if (key === 'Backspace') {
          const lineText = stateAfterRecord.buffer[cursor.line];
          if (cursor.col > 0) {
            const newLine = lineText.slice(0, cursor.col - 1) + lineText.slice(cursor.col);
            const newBuffer = [...stateAfterRecord.buffer];
            newBuffer[cursor.line] = newLine;
            return { ...stateAfterRecord, buffer: newBuffer, cursor: { ...cursor, col: cursor.col - 1 } };
          } else if (cursor.line > 0) {
            const prevLine = stateAfterRecord.buffer[cursor.line - 1];
            const newBuffer = [...stateAfterRecord.buffer];
            newBuffer[cursor.line - 1] = prevLine + lineText;
            newBuffer.splice(cursor.line, 1);
            return { ...stateAfterRecord, buffer: newBuffer, cursor: { line: cursor.line - 1, col: prevLine.length } };
          }
          return stateAfterRecord;
        }

        if (key === 'Enter') {
          const lineText = stateAfterRecord.buffer[cursor.line];
          const before = lineText.slice(0, cursor.col);
          const after = lineText.slice(cursor.col);
          const newBuffer = [...stateAfterRecord.buffer];
          newBuffer[cursor.line] = before;
          newBuffer.splice(cursor.line + 1, 0, after);
          return { ...stateAfterRecord, buffer: newBuffer, cursor: { line: cursor.line + 1, col: 0 } };
        }

        if (key.length === 1 && !ctrlKey) {
          const lineText = stateAfterRecord.buffer[cursor.line];
          const newLine = lineText.slice(0, cursor.col) + key + lineText.slice(cursor.col);
          const newBuffer = [...stateAfterRecord.buffer];
          newBuffer[cursor.line] = newLine;
          return { ...stateAfterRecord, buffer: newBuffer, cursor: { ...cursor, col: cursor.col + 1 } };
        }

        return stateAfterRecord;
      }

      // NORMAL MODE
      if (mode === 'normal') {
        if (key === 'Escape') {
          return {
            ...state,
            pendingOperator: null,
            pendingReplace: false,
            pendingFind: null,
            pendingTextObject: null,
            pendingSearch: null,
            count: '',
            changeRecording: null,
            recordingCount: null,
            recordingExitCursor: null,
            recordingInsertCursor: null
          };
        }

        if (state.pendingSearch) {
          if (key === 'Escape') {
            return { ...state, pendingSearch: null, count: '' };
          }

          if (key === 'Backspace') {
            const pattern = state.pendingSearch.pattern.slice(0, -1);
            return { ...state, pendingSearch: { ...state.pendingSearch, pattern } };
          }

          if (key === 'Enter') {
            const pattern = state.pendingSearch.pattern;
            const direction = state.pendingSearch.direction;
            const match = findPatternFromCursor(buffer, pattern, cursor, direction);
            const lastSearch = { pattern, direction };
            if (match) {
              return {
                ...state,
                cursor: match,
                pendingSearch: null,
                lastSearch,
                count: '',
                lastCommand: { type: 'move' }
              };
            }
            return { ...state, pendingSearch: null, lastSearch, count: '' };
          }

          if (key && key.length === 1 && !ctrlKey) {
            return { ...state, pendingSearch: { ...state.pendingSearch, pattern: state.pendingSearch.pattern + key } };
          }

          return state;
        }

        // Dot command - repeat last change
        if (key === '.' && state.lastChange && state.lastChangeCount && !pendingOperator && !pendingReplace) {
          const repeatCount = getCount(state);
          const changeCount = state.count ? repeatCount : state.lastChangeCount;
          const firstKey = state.lastChange[0]?.key;
          const secondKey = state.lastChange[1]?.key;

          let replayCursor = state.cursor;
          const lineText = state.buffer[replayCursor.line] ?? '';

          // Special handling for repeating c$ when cursor landed at line end
          if (firstKey === 'c' && secondKey === '$' && lineText.length > 0) {
            if (replayCursor.col >= lineText.length - 1) {
              replayCursor = { ...replayCursor, col: findWordStart(lineText, replayCursor.col) };
            }
          }

          // For cw repeats, if we're right after a space, align to that space
          if (firstKey === 'c' && secondKey === 'w') {
            if (replayCursor.col > 0 && isWhitespace(lineText[replayCursor.col - 1])) {
              replayCursor = { ...replayCursor, col: replayCursor.col - 1 };
            }
          }

          const insertCommands = new Set(['i', 'I', 'a', 'A', 'o', 'O', 's']);
          if (insertCommands.has(firstKey) && replayCursor.col < lineText.length - 1 && isWhitespace(lineText[replayCursor.col])) {
            replayCursor = { ...replayCursor, col: replayCursor.col + 1 };
          }

          const shouldUseInsertCursor =
            state.lastChangeCursor &&
            state.lastChangeInsertCursor &&
            replayCursor.line === state.lastChangeCursor.line &&
            replayCursor.col === state.lastChangeCursor.col;
          let resultState = shouldUseInsertCursor
            ? { ...state, cursor: { ...state.lastChangeInsertCursor } }
            : { ...state, cursor: replayCursor };

          for (let i = 0; i < repeatCount; i++) {
            resultState = replayKeys(resultState, state.lastChange, changeCount);
          }

          return { ...resultState, count: '' };
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

        if (key === '/' || key === '?') {
          return {
            ...state,
            pendingSearch: { direction: key === '/' ? 'forward' : 'backward', pattern: '' },
            count: ''
          };
        }

        if ((key === '*' || key === '#') && !pendingOperator && !pendingReplace) {
          const wordInfo = getWordUnderCursor(buffer, cursor);
          if (!wordInfo) return state;
          const direction = key === '*' ? 'forward' : 'backward';
          const match = findPatternFromCursor(buffer, wordInfo.word, cursor, direction);
          const lastSearch = { pattern: wordInfo.word, direction };
          if (match) {
            return { ...state, cursor: match, lastSearch, count: '', lastCommand: { type: 'move' } };
          }
          return { ...state, lastSearch, count: '' };
        }

        if ((key === 'n' || key === 'N') && state.lastSearch) {
          const direction = key === 'n'
            ? state.lastSearch.direction
            : state.lastSearch.direction === 'forward'
              ? 'backward'
              : 'forward';
          const match = findPatternFromCursor(buffer, state.lastSearch.pattern, cursor, direction);
          if (match) {
            return { ...state, cursor: match, count: '', lastCommand: { type: 'move' } };
          }
          return { ...state, count: '' };
        }

        // Undo
        if (key === 'u' && !ctrlKey) {
          if (state.historyIndex >= 0) {
            const prevState = state.history[state.historyIndex];
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(createSnapshot(state));
            const newHistoryIndex = Math.max(0, state.historyIndex - 1);
            return {
              ...prevState,
              history: newHistory,
              historyIndex: newHistoryIndex,
              lastChange: state.lastChange,
              lastChangeCount: state.lastChangeCount,
              changeRecording: null,
              recordingCount: null,
              recordingExitCursor: null,
              recordingInsertCursor: null,
              pendingOperator: null,
              pendingReplace: false,
              pendingFind: null,
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
              lastChange: state.lastChange,
              lastChangeCount: state.lastChangeCount,
              changeRecording: null,
              recordingCount: null,
              recordingExitCursor: null,
              recordingInsertCursor: null,
              pendingOperator: null,
              pendingReplace: false,
              pendingFind: null,
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
              const stateWithKey = recordKey(stateWithHistory, key, ctrlKey || false);
              const stateFinished = finishRecording(stateWithKey);
              const newLine = lineText.slice(0, cursor.col) + key + lineText.slice(cursor.col + 1);
              const newBuffer = [...buffer];
              newBuffer[cursor.line] = newLine;
              return {
                ...stateFinished,
                buffer: newBuffer,
                pendingReplace: false,
                lastCommand: { type: 'delete-char' }
              };
            }
          }
          return { ...state, pendingReplace: false, changeRecording: null, recordingCount: null, recordingExitCursor: null, recordingInsertCursor: null };
        }

        // Handle Pending Operator
        if (pendingOperator) {
          const operator = pendingOperator;

          // dd/yy - Delete/Yank line(s)
          if ((pendingOperator === 'd' || pendingOperator === 'y') && key === pendingOperator) {
            const count = getCount(state);
            const startLine = cursor.line;
            const endLine = Math.min(cursor.line + count - 1, buffer.length - 1);
            const linesToProcess = buffer.slice(startLine, endLine + 1);
            const yankedText = linesToProcess.join('\n') + '\n';

            if (pendingOperator === 'y') {
              // yy - Yank line(s) (not a change, don't record)
              return {
                ...state,
                register: yankedText,
                pendingOperator: null,
                pendingTextObject: null,
                count: '',
                lastCommand: { type: 'yank' },
                changeRecording: null,
                recordingCount: null,
                recordingExitCursor: null,
                recordingInsertCursor: null
              };
            } else {
              // dd - Delete line(s)
              const stateWithHistory = pushHistory(state);
              const stateWithKey = recordKey(stateWithHistory, key, ctrlKey || false);
              const stateFinished = finishRecording(stateWithKey);
              const newBuffer = [...buffer];
              newBuffer.splice(startLine, endLine - startLine + 1);
              if (newBuffer.length === 0) newBuffer.push('');
              let newLineIdx = startLine;
              if (newLineIdx >= newBuffer.length) newLineIdx = newBuffer.length - 1;

              return {
                ...stateFinished,
                buffer: newBuffer,
                cursor: { line: newLineIdx, col: 0 },
                pendingOperator: null,
                pendingTextObject: null,
                register: yankedText,
                count: '',
                lastCommand: { type: 'delete-line' }
              };
            }
          }

          if (state.pendingTextObject) {
            const textObjectMotion = buildTextObjectMotion(state.pendingTextObject, key);
            if (textObjectMotion) {
              const recorded = recordKey(state, key, ctrlKey || false);
              const resultState = applyOperatorMotion(recorded, operator, textObjectMotion);
              return { ...resultState, pendingOperator: null };
            }
            return {
              ...state,
              pendingOperator: null,
              pendingTextObject: null,
              count: '',
              changeRecording: null,
              recordingCount: null,
              recordingExitCursor: null,
              recordingInsertCursor: null
            };
          }

          if (key === 'i' || key === 'a') {
            const recorded = recordKey(state, key, ctrlKey || false);
            return { ...recorded, pendingTextObject: key as 'i' | 'a' };
          }

          // Operator + Motion
          if (['h', 'j', 'k', 'l', 'w', 'b', 'e', '0', '$', '^', '_', 'W', 'B', 'E'].includes(key)) {
            const recorded = recordKey(state, key, ctrlKey || false);
            const resultState = applyOperatorMotion(recorded, operator, key as Motion);
            return { ...resultState, pendingOperator: null };
          }

          return {
            ...state,
            pendingOperator: null,
            pendingTextObject: null,
            count: '',
            changeRecording: null,
            recordingCount: null,
            recordingExitCursor: null,
            recordingInsertCursor: null
          };
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

        // Operators (only d and c are changes, y is not)
        if (key === 'd') {
          const stateWithRecording = startRecording(state, key, ctrlKey || false);
          return { ...stateWithRecording, pendingOperator: 'd', pendingTextObject: null };
        }
        if (key === 'c') {
          const stateWithRecording = startRecording(state, key, ctrlKey || false);
          return { ...stateWithRecording, pendingOperator: 'c', pendingTextObject: null };
        }
        if (key === 'y') return { ...state, pendingOperator: 'y', pendingTextObject: null };

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
                lastCommand: { type: 'yank' }
              };
            } else {
              // Character-wise paste: insert after cursor
              const lineText = buffer[cursor.line];
              const insertCol = Math.min(cursor.col + 1, lineText.length);
              let newLine = lineText.slice(0, insertCol) + state.register + lineText.slice(insertCol);
              if (state.register.endsWith(' ') && lineText.slice(insertCol).length > 0 && !newLine.endsWith(' ')) {
                newLine = `${newLine} `;
              }
              const newBuffer = [...buffer];
              newBuffer[cursor.line] = newLine;
              return {
                ...stateWithHistory,
                buffer: newBuffer,
                cursor: { ...cursor, col: insertCol + state.register.length - 1 },
                lastCommand: { type: 'yank' }
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
                lastCommand: { type: 'yank' }
              };
            } else {
              // Character-wise paste: insert before cursor
              const lineText = buffer[cursor.line];
              let newLine = lineText.slice(0, cursor.col) + state.register + lineText.slice(cursor.col);
              if (state.register.endsWith(' ') && lineText.slice(cursor.col).length > 0 && !newLine.endsWith(' ')) {
                newLine = `${newLine} `;
              }
              const newBuffer = [...buffer];
              newBuffer[cursor.line] = newLine;
              return {
                ...stateWithHistory,
                buffer: newBuffer,
                cursor: { ...cursor, col: cursor.col + state.register.length - 1 },
                lastCommand: { type: 'yank' }
              };
            }
          }
          return state;
        }

        // Delete char
        if (key === 'x') {
          const lineText = buffer[cursor.line];
          if (lineText.length > 0) {
            const count = getCount(state);
            const deleteCount = Math.min(count, lineText.length - cursor.col);
            const stateWithHistory = pushHistory(state);
            const newLine = lineText.slice(0, cursor.col) + lineText.slice(cursor.col + deleteCount);
            const newBuffer = [...buffer];
            newBuffer[cursor.line] = newLine;
            let newCol = cursor.col;
            if (newCol >= newLine.length) newCol = Math.max(0, newLine.length - 1);

            // Record and immediately finish for single-action change
            const stateWithRecording = startRecording(stateWithHistory, key, ctrlKey || false);
            const stateFinished = finishRecording(stateWithRecording);

            return {
              ...stateFinished,
              buffer: newBuffer,
              cursor: { ...cursor, col: newCol },
              count: '',
              lastCommand: { type: 'delete-char' }
            };
          }
          return state;
        }

        // Substitute char (delete and enter insert)
        if (key === 's') {
          const stateWithHistory = pushHistory(state);
          const stateWithRecording = startRecording(stateWithHistory, key, ctrlKey || false);
          const lineText = buffer[cursor.line];
          if (lineText.length > 0) {
            const newLine = lineText.slice(0, cursor.col) + lineText.slice(cursor.col + 1);
            const newBuffer = [...buffer];
            newBuffer[cursor.line] = newLine;
            return {
              ...stateWithRecording,
              mode: 'insert',
              buffer: newBuffer,
              lastCommand: { type: 'delete-char' }
            };
          }
          return { ...stateWithRecording, mode: 'insert', lastCommand: { type: 'enter-insert' } };
        }

        // Replace char
        if (key === 'r') {
          const stateWithRecording = startRecording(state, key, ctrlKey || false);
          return { ...stateWithRecording, pendingReplace: true };
        }

        // Mode Switching
        if (key === 'i') {
          const stateWithHistory = pushHistory(state);
          const stateWithRecording = startRecording(stateWithHistory, key, ctrlKey || false);
          return { ...stateWithRecording, mode: 'insert', lastCommand: { type: 'enter-insert' } };
        }
        if (key === 'I') {
          const stateWithHistory = pushHistory(state);
          const stateWithRecording = startRecording(stateWithHistory, key, ctrlKey || false);
          const lineText = buffer[cursor.line];
          let col = lineText.search(/\S/);
          if (col === -1) col = lineText.length;
          return { ...stateWithRecording, mode: 'insert', cursor: { ...cursor, col }, lastCommand: { type: 'enter-insert' } };
        }
        if (key === 'a') {
          const stateWithHistory = pushHistory(state);
          const stateWithRecording = startRecording(stateWithHistory, key, ctrlKey || false);
          return {
            ...stateWithRecording,
            mode: 'insert',
            cursor: { ...cursor, col: Math.min(buffer[cursor.line].length, cursor.col + 1) },
            lastCommand: { type: 'enter-insert' }
          };
        }
        if (key === 'A') {
          const stateWithHistory = pushHistory(state);
          const stateWithRecording = startRecording(stateWithHistory, key, ctrlKey || false);
          return {
            ...stateWithRecording,
            mode: 'insert',
            cursor: { ...cursor, col: buffer[cursor.line].length },
            lastCommand: { type: 'enter-insert' }
          };
        }
        if (key === 'o') {
          const stateWithHistory = pushHistory(state);
          const stateWithRecording = startRecording(stateWithHistory, key, ctrlKey || false);
          const newBuffer = [...buffer];
          newBuffer.splice(cursor.line + 1, 0, '');
          return {
            ...stateWithRecording,
            mode: 'insert',
            buffer: newBuffer,
            cursor: { line: cursor.line + 1, col: 0 },
            lastCommand: { type: 'open-line' }
          };
        }
        if (key === 'O') {
          const stateWithHistory = pushHistory(state);
          const stateWithRecording = startRecording(stateWithHistory, key, ctrlKey || false);
          const newBuffer = [...buffer];
          newBuffer.splice(cursor.line, 0, '');
          return {
            ...stateWithRecording,
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
