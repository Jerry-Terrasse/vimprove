import type { VimState, VimAction, Motion, KeyPress, Operator, OperatorMotion, TextObject } from './types';
import { getMotionTarget, findCharOnLine } from './motions';
import { applyOperatorWithMotion } from './operators';
import { isWhitespace, isWordChar } from './utils';
import {
  clearPendingStates,
  createSnapshot,
  finishRecording,
  getCount,
  pushHistory,
  recordKey,
  startRecording,
} from './stateUtils';

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
  const idx = Math.min(cursor.col, Math.max(0, lineText.length - 1));

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

const applyPaste = (state: VimState, before: boolean): VimState => {
  if (!state.register) return state;
  const stateWithHistory = pushHistory(state);
  const { buffer, cursor, register } = stateWithHistory;
  const isLinewise = register.endsWith('\n');

  if (isLinewise) {
    const content = register.slice(0, -1);
    const newBuffer = [...buffer];
    const insertLine = before ? cursor.line : cursor.line + 1;
    newBuffer.splice(insertLine, 0, content);
    const newCursor = before ? cursor.line : cursor.line + 1;
    return {
      ...stateWithHistory,
      buffer: newBuffer,
      cursor: { line: newCursor, col: 0 },
      lastCommand: { type: 'yank' }
    };
  }

  const lineText = buffer[cursor.line];
  const insertCol = before ? cursor.col : Math.min(cursor.col + 1, lineText.length);
  let newLine = lineText.slice(0, insertCol) + register + lineText.slice(insertCol);
  if (register.endsWith(' ') && lineText.slice(insertCol).length > 0 && !newLine.endsWith(' ')) {
    newLine = `${newLine} `;
  }
  const newBuffer = [...buffer];
  newBuffer[cursor.line] = newLine;
  return {
    ...stateWithHistory,
    buffer: newBuffer,
    cursor: { ...cursor, col: insertCol + register.length - 1 },
    lastCommand: { type: 'yank' }
  };
};

const handleInsertKey = (state: VimState, key: string, ctrlKey: boolean): VimState => {
  const { buffer, cursor } = state;

  if (key === 'Escape') {
    const latestSnapshot = state.history[state.historyIndex];
    const hasBufferChanged = latestSnapshot
      ? latestSnapshot.buffer.length !== buffer.length || latestSnapshot.buffer.some((line, idx) => line !== buffer[idx])
      : true;
    const stateToFinish = hasBufferChanged && state.changeRecording
      ? recordKey(state, key, ctrlKey || false)
      : state;
    // With insertCol model, cursor.col is already on the correct character
    // No need to move back (cursor.col is display position, not insertion point)
    const exitCursor = cursor;
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
      insertCol: undefined,  // Clear insertCol when exiting Insert mode
      lastCommand: { type: 'mode-switch', to: 'normal' }
    };
  }

  const stateAfterRecord = recordKey(state, key, ctrlKey || false);

  if (key === 'Backspace') {
    const lineText = stateAfterRecord.buffer[cursor.line];
    const insertCol = stateAfterRecord.insertCol ?? cursor.col;
    if (insertCol > 0) {
      const newLine = lineText.slice(0, insertCol - 1) + lineText.slice(insertCol);
      const newBuffer = [...stateAfterRecord.buffer];
      newBuffer[cursor.line] = newLine;
      const newInsertCol = insertCol - 1;
      const newCursorCol = newInsertCol > 0 ? newInsertCol - 1 : 0;
      return {
        ...stateAfterRecord,
        buffer: newBuffer,
        cursor: { ...cursor, col: newCursorCol },
        insertCol: newInsertCol
      };
    } else if (cursor.line > 0) {
      const prevLine = stateAfterRecord.buffer[cursor.line - 1];
      const newBuffer = [...stateAfterRecord.buffer];
      newBuffer[cursor.line - 1] = prevLine + lineText;
      newBuffer.splice(cursor.line, 1);
      const newInsertCol = prevLine.length;
      const newCursorCol = newInsertCol > 0 ? newInsertCol - 1 : 0;
      return {
        ...stateAfterRecord,
        buffer: newBuffer,
        cursor: { line: cursor.line - 1, col: newCursorCol },
        insertCol: newInsertCol
      };
    }
    return stateAfterRecord;
  }

  if (key === 'Enter') {
    const lineText = stateAfterRecord.buffer[cursor.line];
    const insertCol = stateAfterRecord.insertCol ?? cursor.col;
    const before = lineText.slice(0, insertCol);
    const after = lineText.slice(insertCol);
    const newBuffer = [...stateAfterRecord.buffer];
    newBuffer[cursor.line] = before;
    newBuffer.splice(cursor.line + 1, 0, after);
    return {
      ...stateAfterRecord,
      buffer: newBuffer,
      cursor: { line: cursor.line + 1, col: 0 },
      insertCol: 0
    };
  }

  if (key.length === 1 && !ctrlKey) {
    const lineText = stateAfterRecord.buffer[cursor.line];
    const insertCol = stateAfterRecord.insertCol ?? cursor.col;
    const newLine = lineText.slice(0, insertCol) + key + lineText.slice(insertCol);
    const newBuffer = [...stateAfterRecord.buffer];
    newBuffer[cursor.line] = newLine;
    const newInsertCol = insertCol + 1;
    const newCursorCol = newInsertCol - 1;  // Cursor on the just-inserted character
    return {
      ...stateAfterRecord,
      buffer: newBuffer,
      cursor: { ...cursor, col: newCursorCol },
      insertCol: newInsertCol
    };
  }

  return stateAfterRecord;
};

const handleNormalKey = (state: VimState, key: string, ctrlKey: boolean): VimState => {
  const { buffer, cursor, pendingOperator, pendingReplace } = state;

  if (key === 'Escape') {
    return clearPendingStates(state);
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

  if (key === '.' && state.lastChange && state.lastChangeCount && !pendingOperator && !pendingReplace) {
    const repeatCount = getCount(state);
    const changeCount = state.count ? repeatCount : state.lastChangeCount;
    const firstKey = state.lastChange[0]?.key;
    const secondKey = state.lastChange[1]?.key;

    let replayCursor = state.cursor;
    const lineText = state.buffer[replayCursor.line] ?? '';

    if (firstKey === 'c' && secondKey === '$' && lineText.length > 0) {
      if (replayCursor.col >= lineText.length - 1) {
        replayCursor = { ...replayCursor, col: findWordStart(lineText, replayCursor.col) };
      }
    }

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
    return clearPendingStates(state);
  }

  if (pendingOperator) {
    const operator = pendingOperator;

    if ((pendingOperator === 'd' || pendingOperator === 'y') && key === pendingOperator) {
      const count = getCount(state);
      const startLine = cursor.line;
      const endLine = Math.min(cursor.line + count - 1, buffer.length - 1);
      const linesToProcess = buffer.slice(startLine, endLine + 1);
      const yankedText = linesToProcess.join('\n') + '\n';

      if (pendingOperator === 'y') {
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
      return clearPendingStates(state);
    }

    if (key === 'i' || key === 'a') {
      const recorded = recordKey(state, key, ctrlKey || false);
      return { ...recorded, pendingTextObject: key as 'i' | 'a' };
    }

    if (['h', 'j', 'k', 'l', 'w', 'b', 'e', '0', '$', '^', '_', 'W', 'B', 'E'].includes(key)) {
      const recorded = recordKey(state, key, ctrlKey || false);
      const resultState = applyOperatorMotion(recorded, operator, key as Motion);
      return { ...resultState, pendingOperator: null };
    }

    return clearPendingStates(state);
  }

  if (['h', 'j', 'k', 'l', 'w', 'b', 'e', '0', '$', '^', '_', 'W', 'B', 'E'].includes(key)) {
    const count = getCount(state);
    let newPos = state.cursor;
    let tempState = state;

    for (let i = 0; i < count; i++) {
      newPos = getMotionTarget(tempState, key as Motion);
      tempState = { ...tempState, cursor: newPos };
    }

    return { ...state, cursor: newPos, count: '', lastCommand: { type: 'move', motion: key as Motion } };
  }

  if (['f', 'F', 't', 'T'].includes(key)) {
    return { ...state, pendingFind: key as 'f' | 'F' | 't' | 'T' };
  }

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

  if (key === ',' && state.lastFind) {
    const lineText = buffer[cursor.line];
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

  if (key === 'd') {
    const stateWithRecording = startRecording(state, key, ctrlKey || false);
    return { ...stateWithRecording, pendingOperator: 'd', pendingTextObject: null };
  }
  if (key === 'c') {
    const stateWithRecording = startRecording(state, key, ctrlKey || false);
    return { ...stateWithRecording, pendingOperator: 'c', pendingTextObject: null };
  }
  if (key === 'y') return { ...state, pendingOperator: 'y', pendingTextObject: null };

  if (key === 'p') {
    return applyPaste(state, false);
  }

  if (key === 'P') {
    return applyPaste(state, true);
  }

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

  if (key === 's') {
    const stateWithHistory = pushHistory(state);
    const stateWithRecording = startRecording(stateWithHistory, key, ctrlKey || false);
    const lineText = buffer[cursor.line];
    if (lineText.length > 0) {
      const deleteCol = cursor.col;
      const newLine = lineText.slice(0, deleteCol) + lineText.slice(deleteCol + 1);
      const newBuffer = [...buffer];
      newBuffer[cursor.line] = newLine;
      const insertCol = deleteCol;
      // Cursor should be on the character before insertion point (if exists)
      const newCursorCol = deleteCol > 0 ? Math.min(deleteCol - 1, Math.max(0, newLine.length - 1)) : 0;
      return {
        ...stateWithRecording,
        mode: 'insert',
        buffer: newBuffer,
        cursor: { ...cursor, col: newCursorCol },
        insertCol,
        lastCommand: { type: 'delete-char' }
      };
    }
    return {
      ...stateWithRecording,
      mode: 'insert',
      cursor: { ...cursor, col: 0 },
      insertCol: 0,
      lastCommand: { type: 'enter-insert' }
    };
  }

  if (key === 'r') {
    const stateWithRecording = startRecording(state, key, ctrlKey || false);
    return { ...stateWithRecording, pendingReplace: true };
  }

  if (key === 'i') {
    const stateWithHistory = pushHistory(state);
    const stateWithRecording = startRecording(stateWithHistory, key, ctrlKey || false);
    return {
      ...stateWithRecording,
      mode: 'insert',
      insertCol: cursor.col,  // Insert before current character
      lastCommand: { type: 'enter-insert' }
    };
  }
  if (key === 'I') {
    const stateWithHistory = pushHistory(state);
    const stateWithRecording = startRecording(stateWithHistory, key, ctrlKey || false);
    const lineText = buffer[cursor.line];
    let col = lineText.search(/\S/);
    if (col === -1) col = lineText.length;
    return {
      ...stateWithRecording,
      mode: 'insert',
      cursor: { ...cursor, col },
      insertCol: col,  // Insert at first non-blank
      lastCommand: { type: 'enter-insert' }
    };
  }
  if (key === 'a') {
    const stateWithHistory = pushHistory(state);
    const stateWithRecording = startRecording(stateWithHistory, key, ctrlKey || false);
    const newCol = Math.min(buffer[cursor.line].length, cursor.col + 1);
    return {
      ...stateWithRecording,
      mode: 'insert',
      cursor: { ...cursor, col: newCol },
      insertCol: newCol,  // Insert after current character
      lastCommand: { type: 'enter-insert' }
    };
  }
  if (key === 'A') {
    const stateWithHistory = pushHistory(state);
    const stateWithRecording = startRecording(stateWithHistory, key, ctrlKey || false);
    const lineText = buffer[cursor.line];
    const lineLen = lineText.length;
    const cursorCol = lineLen > 0 ? lineLen - 1 : 0;
    return {
      ...stateWithRecording,
      mode: 'insert',
      cursor: { ...cursor, col: cursorCol },  // Cursor on last char (or 0 if empty)
      insertCol: lineLen,  // Insert at EOL
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
      insertCol: 0,  // Insert at start of new line
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
      insertCol: 0,  // Insert at start of new line
      lastCommand: { type: 'open-line-above' }
    };
  }

  return state;
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
  const { buffer, mode } = state;

  if (!buffer.length) return { ...state, buffer: [''] };

  switch (type) {
    case 'RESET':
      return { ...INITIAL_VIM_STATE, ...payload };

    case 'KEYDOWN': {
      const { key, ctrlKey } = payload;

      if (mode === 'insert') {
        return handleInsertKey(state, key, ctrlKey || false);
      }

      if (mode === 'normal') {
        return handleNormalKey(state, key, ctrlKey || false);
      }

      return state;
    }

    default:
      return state;
  }
};
