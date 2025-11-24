import type { VimState, VimAction, Motion, KeyPress, Operator, OperatorMotion, TextObject, Cursor } from './types';
import { getMotionTarget, findCharOnLine } from './motions';
import { applyOperatorWithMotion, applyOperatorWithFindMotion, buildRegisterText, deleteRange } from './operators';
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
    // Search from cursor to end of buffer
    for (let line = cursor.line; line < buffer.length; line++) {
      const lineText = buffer[line];
      const startCol = line === cursor.line ? cursor.col + 1 : 0;
      const idx = lineText.indexOf(pattern, startCol);
      if (idx !== -1) return { line, col: idx };
    }
    // Wrap around: search from start to cursor line
    for (let line = 0; line < cursor.line; line++) {
      const lineText = buffer[line];
      const idx = lineText.indexOf(pattern, 0);
      if (idx !== -1) return { line, col: idx };
    }
    // Check cursor line from start to cursor position
    const cursorLineText = buffer[cursor.line];
    const idx = cursorLineText.indexOf(pattern, 0);
    if (idx !== -1 && idx <= cursor.col) return { line: cursor.line, col: idx };
  } else {
    // Search from cursor to start of buffer
    for (let line = cursor.line; line >= 0; line--) {
      const lineText = buffer[line];
      const startCol = line === cursor.line ? Math.max(0, cursor.col - 1) : lineText.length - 1;
      if (startCol < 0) continue;
      const segment = lineText.slice(0, startCol + 1);
      const idx = segment.lastIndexOf(pattern);
      if (idx !== -1) return { line, col: idx };
    }
    // Wrap around: search from end to cursor line
    for (let line = buffer.length - 1; line > cursor.line; line--) {
      const lineText = buffer[line];
      const idx = lineText.lastIndexOf(pattern);
      if (idx !== -1) return { line, col: idx };
    }
    // Check cursor line from end to cursor position
    const cursorLineText = buffer[cursor.line];
    const idx = cursorLineText.lastIndexOf(pattern);
    if (idx !== -1 && idx >= cursor.col) return { line: cursor.line, col: idx };
  }

  return null;
};

const getWordUnderCursor = (buffer: string[], cursor: { line: number; col: number }): { word: string; startCol: number } | null => {
  const lineText = buffer[cursor.line] ?? '';
  if (!lineText.length) return null;
  const idx = Math.min(cursor.col, Math.max(0, lineText.length - 1));

  if (isWhitespace(lineText[idx])) return null;

  let targetIdx = idx;
  if (!isWordChar(lineText[idx])) {
    let right = idx + 1;
    while (right < lineText.length && !isWhitespace(lineText[right])) {
      if (isWordChar(lineText[right])) {
        targetIdx = right;
        break;
      }
      right++;
    }
    if (targetIdx === idx) {
      let left = idx - 1;
      while (left >= 0 && !isWhitespace(lineText[left])) {
        if (isWordChar(lineText[left])) {
          targetIdx = left;
          break;
        }
        left--;
      }
    }
    if (targetIdx === idx && !isWordChar(lineText[targetIdx])) return null;
  }

  const targetIsWord = isWordChar(lineText[targetIdx]);
  let start = targetIdx;
  while (start > 0) {
    const char = lineText[start - 1];
    if (isWhitespace(char)) break;
    const charIsWord = isWordChar(char);
    if (charIsWord !== targetIsWord) break;
    start--;
  }

  let end = targetIdx;
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

const sliceText = (buffer: string[], start: Cursor, end: Cursor): string => {
  if (start.line > end.line || (start.line === end.line && start.col > end.col)) {
    return sliceText(buffer, end, start);
  }
  if (start.line === end.line) {
    return (buffer[start.line] ?? '').slice(start.col, end.col);
  }
  const parts: string[] = [];
  parts.push((buffer[start.line] ?? '').slice(start.col));
  for (let line = start.line + 1; line < end.line; line++) {
    parts.push(buffer[line] ?? '');
  }
  parts.push((buffer[end.line] ?? '').slice(0, end.col));
  return parts.join('\n');
};

const insertTextAt = (buffer: string[], pos: Cursor, text: string): { buffer: string[]; cursor: Cursor } => {
  const lines = text.split('\n');
  const currentLine = buffer[pos.line] ?? '';
  const before = currentLine.slice(0, pos.col);
  const after = currentLine.slice(pos.col);

  if (lines.length === 1) {
    const newLine = before + text + after;
    const newBuffer = [...buffer];
    newBuffer[pos.line] = newLine;
    return { buffer: newBuffer, cursor: { line: pos.line, col: pos.col + text.length } };
  }

  const firstLine = before + lines[0];
  const lastLine = lines[lines.length - 1] + after;
  const middle = lines.slice(1, -1);
  const replacement = [firstLine, ...middle, lastLine];
  const newBuffer = [...buffer];
  newBuffer.splice(pos.line, 1, ...replacement);
  const newLineIdx = pos.line + replacement.length - 1;
  const newCol = lines[lines.length - 1].length;
  return { buffer: newBuffer, cursor: { line: newLineIdx, col: newCol } };
};

const isSameContent = (a: VimState, b: VimState): boolean => {
  if (a.mode !== b.mode) return false;
  if (a.buffer.length !== b.buffer.length) return false;
  for (let i = 0; i < a.buffer.length; i++) {
    if (a.buffer[i] !== b.buffer[i]) return false;
  }
  return true;
};

const applyOperatorMotion = (state: VimState, operator: Operator, motion: OperatorMotion): VimState => {
  const count = getCount(state);

  if (motion === '$' && count > 1) {
    const targetLine = state.cursor.line + count - 1;
    if (targetLine >= state.buffer.length) {
      return {
        ...state,
        count: '',
        pendingOperator: null,
        pendingTextObject: null
      };
    }
    const targetCol = state.buffer[targetLine]?.length ?? 0;
    const range = {
      start: state.cursor,
      end: { line: targetLine, col: targetCol }
    };
    const registerText = buildRegisterText(state.buffer, range);

    if (operator === 'y') {
      return {
        ...state,
        register: registerText,
        pendingOperator: null,
        pendingTextObject: null,
        count: '',
        lastCommand: { type: 'yank' },
        changeRecording: null,
        recordingCount: null
      };
    }

    const stateWithHistory = pushHistory(state);
    const { buffer, cursor } = deleteRange(stateWithHistory.buffer, range);
    let nextState: VimState = {
      ...stateWithHistory,
      buffer,
      cursor,
      register: registerText,
      pendingOperator: null,
      pendingTextObject: null,
      mode: operator === 'c' ? 'insert' : 'normal',
      insertCol: operator === 'c' ? cursor.col : undefined,
      insertStart: operator === 'c' ? { ...cursor } : state.insertStart,
      count: '',
      lastCommand: { type: 'delete-range', operator, motion: '$' }
    };

    if (operator === 'd') {
      nextState = finishRecording(nextState);
    }

    return nextState;
  }

  if ((motion === 'w' || motion === 'W') && count > 1) {
    let tempCursor = state.cursor;
    let tempState = state;
    for (let i = 0; i < count; i++) {
      tempCursor = getMotionTarget(tempState, motion as Motion, true);
      tempState = { ...tempState, cursor: tempCursor };
    }

    const range = { start: state.cursor, end: tempCursor };

    const registerText = buildRegisterText(state.buffer, range);
    if (operator === 'y') {
      return {
        ...state,
        register: registerText,
        pendingOperator: null,
        pendingTextObject: null,
        count: '',
        lastCommand: { type: 'yank' },
        changeRecording: null,
        recordingCount: null
      };
    }

    const stateWithHistory = pushHistory(state);
    const { buffer, cursor } = deleteRange(stateWithHistory.buffer, range);
    let nextState: VimState = {
      ...stateWithHistory,
      buffer,
      cursor,
      register: registerText,
      pendingOperator: null,
      pendingTextObject: null,
      mode: operator === 'c' ? 'insert' : 'normal',
      insertCol: operator === 'c' ? cursor.col : undefined,
      count: '',
      lastCommand: { type: 'delete-range', operator, motion }
    };

    if (operator === 'd') {
      nextState = finishRecording(nextState);
    }

    return nextState;
  }

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
    currentState = vimReducer(currentState, {
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
  if (!state.register) return { ...state, count: '' };

  const count = getCount(state);
  const register = state.register;
  const stateWithHistory = pushHistory(state);
  const stateWithRecording = startRecording(stateWithHistory, before ? 'P' : 'p', false);

  const pasteOnce = (
    currentBuffer: string[],
    currentCursor: { line: number; col: number }
  ): { buffer: string[]; cursor: { line: number; col: number } } => {
    const isLinewise = register.endsWith('\n');

    if (isLinewise) {
      const content = register.slice(0, -1);
      const lines = content.split('\n');
      const newBuffer = [...currentBuffer];
      const insertLine = before ? currentCursor.line : currentCursor.line + 1;
      newBuffer.splice(insertLine, 0, ...lines);
      const newCursorLine = Math.min(insertLine, newBuffer.length - 1);
      return { buffer: newBuffer, cursor: { line: newCursorLine, col: 0 } };
    }

    if (register.includes('\n')) {
      const parts = register.split('\n');
      const lineText = currentBuffer[currentCursor.line] ?? '';
      const insertCol = Math.min(before ? currentCursor.col : currentCursor.col + 1, lineText.length);
      const head = lineText.slice(0, insertCol) + (parts[0] ?? '');
      const tail = lineText.slice(insertCol);
      const mid = parts.slice(1, -1);
      const last = parts[parts.length - 1] ?? '';
      if (process.env.DEBUG_PASTE) {
        // eslint-disable-next-line no-console
        console.log('paste-multiline', { lineText, insertCol, parts, before, cursor: currentCursor });
      }

      const newBuffer = [...currentBuffer];
      newBuffer[currentCursor.line] = head;
      newBuffer.splice(currentCursor.line + 1, 0, ...mid, last + tail);

      const cursorLine = currentCursor.line;
      const cursorCol = Math.max(
        0,
        Math.min(newBuffer[cursorLine].length - 1, before ? currentCursor.col : currentCursor.col + 1)
      );
      return { buffer: newBuffer, cursor: { line: cursorLine, col: cursorCol } };
    }

    const lineText = currentBuffer[currentCursor.line] ?? '';
    const insertCol = before ? currentCursor.col : Math.min(currentCursor.col + 1, lineText.length);
    const newLine = lineText.slice(0, insertCol) + register + lineText.slice(insertCol);
    const newBuffer = [...currentBuffer];
    newBuffer[currentCursor.line] = newLine;
    return {
      buffer: newBuffer,
      cursor: { ...currentCursor, col: insertCol + register.length - 1 }
    };
  };

  let workingBuffer = stateWithRecording.buffer;
  let workingCursor = stateWithRecording.cursor;
  for (let i = 0; i < count; i++) {
    const result = pasteOnce(workingBuffer, workingCursor);
    workingBuffer = result.buffer;
    workingCursor = result.cursor;
  }

  const finished = finishRecording({
    ...stateWithRecording,
    buffer: workingBuffer,
    cursor: workingCursor
  });

  return {
    ...finished,
    count: '',
    lastCommand: { type: 'paste', before }
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
    const repeatCount = state.recordingCount ?? 1;
    const insertAnchor = state.insertStart ?? { line: cursor.line, col: state.insertCol ?? cursor.col };
    let workingBuffer = stateToFinish.buffer;
    let insertCursor = cursor;
    let insertCol = state.insertCol ?? cursor.col;

    if (hasBufferChanged && repeatCount > 1) {
      const insertedText = sliceText(workingBuffer, insertAnchor, insertCursor);
      const startedWithOpen = state.changeRecording?.[0]?.key === 'o' || state.changeRecording?.[0]?.key === 'O';
      if (insertedText.length > 0) {
        if (startedWithOpen) {
          const baseLine = insertAnchor.line;
          for (let i = 1; i < repeatCount; i++) {
            const targetLine = baseLine + i;
            if (targetLine < workingBuffer.length) {
              workingBuffer = [...workingBuffer];
              workingBuffer[targetLine] = insertedText;
            } else {
              const nextBuffer = [...workingBuffer];
              nextBuffer.splice(targetLine, 0, insertedText);
              workingBuffer = nextBuffer;
            }
          }
          insertCursor = { line: baseLine + repeatCount - 1, col: insertedText.length };
          insertCol = insertedText.length;
        } else {
          for (let i = 1; i < repeatCount; i++) {
            const result = insertTextAt(workingBuffer, insertCursor, insertedText);
            workingBuffer = result.buffer;
            insertCursor = result.cursor;
          }
          insertCol = insertCursor.col;
        }
      }
    }

    // In insert mode, cursor.col = insertCol (insertion point position)
    // When exiting, move cursor back to last character position
    const lineLen = workingBuffer[insertCursor.line].length;
    const exitCol = insertCol > 0 ? Math.min(insertCol - 1, lineLen - 1) : 0;
    const exitCursor = { ...insertCursor, col: Math.max(0, exitCol) };
    const stateWithCursors = {
      ...stateToFinish,
      buffer: workingBuffer,
      cursor: insertCursor,
      insertCol,
      recordingExitCursor: exitCursor,
      recordingInsertCursor: insertCursor
    };
    const stateAfterRecording = hasBufferChanged
      ? finishRecording({ ...stateWithCursors, mode: 'normal', cursor: exitCursor })
      : { ...state, changeRecording: null, recordingCount: null, recordingExitCursor: null, recordingInsertCursor: null };
    return {
      ...stateAfterRecording,
      mode: 'normal',
      cursor: exitCursor,
      insertCol: undefined,  // Clear insertCol when exiting Insert mode
      insertStart: null,
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
      return {
        ...stateAfterRecord,
        buffer: newBuffer,
        cursor: { ...cursor, col: newInsertCol },
        insertCol: newInsertCol
      };
    } else if (cursor.line > 0) {
      const prevLine = stateAfterRecord.buffer[cursor.line - 1];
      const newBuffer = [...stateAfterRecord.buffer];
      newBuffer[cursor.line - 1] = prevLine + lineText;
      newBuffer.splice(cursor.line, 1);
      const newInsertCol = prevLine.length;
      return {
        ...stateAfterRecord,
        buffer: newBuffer,
        cursor: { line: cursor.line - 1, col: newInsertCol },
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
    return {
      ...stateAfterRecord,
      buffer: newBuffer,
      cursor: { ...cursor, col: newInsertCol },
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
    const hasOverrideCount = state.count.length > 0;
    const overrideCount = hasOverrideCount ? getCount(state) : null;
    const firstKey = state.lastChange[0]?.key;
    const insertCommands = new Set(['i', 'I', 'a', 'A', 'o', 'O', 's']);
    const isInsertReplay = insertCommands.has(firstKey);
    const changeCount = overrideCount ?? state.lastChangeCount;
    const secondKey = state.lastChange[1]?.key;

    let replayCursor = state.cursor;
    const lineText = state.buffer[replayCursor.line] ?? '';

    if (firstKey === 'c' && secondKey === '$' && lineText.length > 0) {
      if (replayCursor.col >= lineText.length - 1) {
        replayCursor = { ...replayCursor, col: findWordStart(lineText, replayCursor.col) };
      }
    }

    if (firstKey === 'c' && secondKey === 'w') {
      const currentChar = lineText[replayCursor.col];
      if (isWhitespace(currentChar)) {
        let nextNonWhitespace = replayCursor.col;
        while (nextNonWhitespace < lineText.length && isWhitespace(lineText[nextNonWhitespace])) {
          nextNonWhitespace++;
        }
        if (nextNonWhitespace < lineText.length) {
          replayCursor = { ...replayCursor, col: nextNonWhitespace };
        }
      }
    }

    if (insertCommands.has(firstKey)) {
      if (replayCursor.col < lineText.length - 1 && isWhitespace(lineText[replayCursor.col])) {
        replayCursor = { ...replayCursor, col: replayCursor.col + 1 };
      }
    }

    let resultState = { ...state, cursor: replayCursor };

    resultState = replayKeys(resultState, state.lastChange, changeCount);
    const newLastChangeCount = overrideCount ?? state.lastChangeCount;
    resultState = { ...resultState, lastChangeCount: newLastChangeCount };

    return { ...resultState, count: '' };
  }

  if (state.pendingFind) {
    if (key.length === 1 && !ctrlKey) {
      const lineText = buffer[cursor.line];
      const newCol = findCharOnLine(lineText, cursor.col, key, state.pendingFind);

      if (newCol !== null) {
        // If there's a pending operator, apply it with the find motion
        if (pendingOperator) {
          const resultState = applyOperatorWithFindMotion(state, pendingOperator, newCol);
          return {
            ...resultState,
            lastFind: { type: state.pendingFind, char: key },
            count: ''
          };
        }

        // No operator, just move cursor
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
    return { ...state, pendingFind: null, pendingOperator: null, count: '' };
  }

  if (!pendingOperator && !pendingReplace && !state.pendingFind && /^[1-9]$/.test(key)) {
    return { ...state, count: state.count + key };
  }

  // Handle find motion keys (can be used standalone or with operators)
  if (['f', 'F', 't', 'T'].includes(key)) {
    return { ...state, pendingFind: key as 'f' | 'F' | 't' | 'T' };
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

  if (key === 'u' && !ctrlKey && !pendingReplace) {
    if (state.historyIndex > 0) {
      let targetIndex = state.historyIndex - 1;
      while (targetIndex > 0 && isSameContent(state.history[targetIndex], state.history[targetIndex - 1])) {
        targetIndex--;
      }
      if (targetIndex < 0) return state;
      const targetState = state.history[targetIndex];
      return {
        ...targetState,
        history: state.history,
        historyIndex: targetIndex,
        lastChange: state.lastChange,
        lastChangeCount: state.lastChangeCount,
        lastChangeCursor: state.lastChangeCursor,
        lastChangeInsertCursor: state.lastChangeInsertCursor,
        pendingOperator: null,
        pendingReplace: false,
        pendingFind: null,
        pendingTextObject: null,
        pendingSearch: null,
        count: '',
      };
    }
    return state;
  }

  if (key === 'r' && ctrlKey) {
    if (state.historyIndex < state.history.length - 1) {
      const targetIndex = state.historyIndex + 1;
      const nextState = state.history[targetIndex];
      const cursorForRedo = state.lastChange
        ? nextState.cursor
        : { line: nextState.cursor.line, col: 0 };
      return {
        ...nextState,
        cursor: cursorForRedo,
        history: state.history,
        historyIndex: targetIndex,
        lastChange: state.lastChange,
        lastChangeCount: state.lastChangeCount,
        lastChangeCursor: state.lastChangeCursor,
        lastChangeInsertCursor: state.lastChangeInsertCursor,
        pendingOperator: null,
        pendingReplace: false,
        pendingFind: null,
        pendingTextObject: null,
        pendingSearch: null,
        count: '',
      };
    }
    return state;
  }

  if (pendingReplace) {
    if (key.length === 1 && !ctrlKey) {
      const lineText = buffer[cursor.line];
      if (cursor.col < lineText.length) {
        const replaceCount = Math.min(getCount(state), lineText.length - cursor.col);
        const stateWithHistory = pushHistory(state);
        const stateWithKey = recordKey(stateWithHistory, key, ctrlKey || false);
        const replaced = key.repeat(replaceCount);
        const newLine = lineText.slice(0, cursor.col) + replaced + lineText.slice(cursor.col + replaceCount);
        const newBuffer = [...buffer];
        newBuffer[cursor.line] = newLine;
        const newCursorCol = Math.max(0, cursor.col + replaceCount - 1);
        const stateFinished = finishRecording({
          ...stateWithKey,
          buffer: newBuffer
        });
        return {
          ...stateFinished,
          pendingReplace: false,
          count: '',
          cursor: { ...cursor, col: newCursorCol },
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
      const available = buffer.length - startLine;
      if (count > available) {
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
      const endLine = startLine + count - 1;
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
        const newBuffer = [...buffer];
        newBuffer.splice(startLine, endLine - startLine + 1);
        if (newBuffer.length === 0) newBuffer.push('');
        let newLineIdx = startLine;
        if (newLineIdx >= newBuffer.length) newLineIdx = newBuffer.length - 1;
        const targetLineLen = newBuffer[newLineIdx]?.length ?? 0;
        const preservedCol = Math.min(cursor.col, Math.max(0, targetLineLen - 1));

        const stateFinished = finishRecording({
          ...stateWithKey,
          buffer: newBuffer,
          cursor: { line: newLineIdx, col: preservedCol },
          register: yankedText
        });

        return {
          ...stateFinished,
          pendingOperator: null,
          pendingTextObject: null,
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
    if (key === '$' && count > 1) {
      const targetLine = cursor.line + count - 1;
      if (targetLine >= buffer.length) {
        return {
          ...state,
          count: '',
          lastCommand: { type: 'move', motion: key as Motion }
        };
      }
      const targetLineText = buffer[targetLine] ?? '';
      const targetCol = Math.max(0, targetLineText.length - 1);
      return {
        ...state,
        cursor: { line: targetLine, col: targetCol },
        count: '',
        lastCommand: { type: 'move', motion: key as Motion }
      };
    }

    let newPos = state.cursor;
    let tempState = state;

    for (let i = 0; i < count; i++) {
      newPos = getMotionTarget(tempState, key as Motion);
      tempState = { ...tempState, cursor: newPos };
    }

    return { ...state, cursor: newPos, count: '', lastCommand: { type: 'move', motion: key as Motion } };
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
      const stateWithRecording = startRecording(stateWithHistory, key, ctrlKey || false);

      const newLine = lineText.slice(0, cursor.col) + lineText.slice(cursor.col + deleteCount);
      const newBuffer = [...buffer];
      newBuffer[cursor.line] = newLine;
      let newCol = cursor.col;
      if (newCol >= newLine.length) newCol = Math.max(0, newLine.length - 1);

      const finished = finishRecording({
        ...stateWithRecording,
        buffer: newBuffer,
        cursor: { ...cursor, col: newCol }
      });

      return {
        ...finished,
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
      const deletedChar = lineText[deleteCol] ?? '';
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
        insertStart: { line: cursor.line, col: insertCol },
        register: deletedChar,
        lastCommand: { type: 'delete-char' }
      };
    }
    return {
      ...stateWithRecording,
      mode: 'insert',
      cursor: { ...cursor, col: 0 },
      insertCol: 0,
      insertStart: { line: cursor.line, col: 0 },
      register: '',
      lastCommand: { type: 'delete-char' }
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
      insertStart: { ...cursor },
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
      insertStart: { line: cursor.line, col },
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
      insertStart: { line: cursor.line, col: newCol },
      lastCommand: { type: 'enter-insert' }
    };
  }
  if (key === 'A') {
    const stateWithHistory = pushHistory(state);
    const stateWithRecording = startRecording(stateWithHistory, key, ctrlKey || false);
    const lineText = buffer[cursor.line];
    const lineLen = lineText.length;
    return {
      ...stateWithRecording,
      mode: 'insert',
      cursor: { ...cursor, col: lineLen },
      insertCol: lineLen,  // Insert at EOL
      insertStart: { line: cursor.line, col: lineLen },
      lastCommand: { type: 'enter-insert' }
    };
  }
  if (key === 'o') {
    const stateWithHistory = pushHistory(state);
    const stateWithRecording = startRecording(stateWithHistory, key, ctrlKey || false);
    const count = getCount(state);
    const newBuffer = [...buffer];
    for (let i = 0; i < count; i++) {
      newBuffer.splice(cursor.line + 1 + i, 0, '');
    }
    return {
      ...stateWithRecording,
      mode: 'insert',
      buffer: newBuffer,
      cursor: { line: cursor.line + 1, col: 0 },
      insertCol: 0,  // Insert at start of new line
      insertStart: { line: cursor.line + 1, col: 0 },
      lastCommand: { type: 'open-line' }
    };
  }
  if (key === 'O') {
    const stateWithHistory = pushHistory(state);
    const stateWithRecording = startRecording(stateWithHistory, key, ctrlKey || false);
    const count = getCount(state);
    const newBuffer = [...buffer];
    for (let i = 0; i < count; i++) {
      newBuffer.splice(cursor.line, 0, '');
    }
    return {
      ...stateWithRecording,
      mode: 'insert',
      buffer: newBuffer,
      cursor: { line: cursor.line, col: 0 },
      insertCol: 0,  // Insert at start of new line
      insertStart: { line: cursor.line, col: 0 },
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
  lastChangeInsertStart: null,
  recordingExitCursor: null,
  recordingInsertCursor: null,
  insertStart: null,
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
