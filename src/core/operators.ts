import type { VimState, Operator, Motion, OperatorMotion, TextObject, Cursor } from './types';
import { getMotionTarget } from './motions';
import { clampCursor, isWhitespace, isWordChar } from './utils';
import { finishRecording, pushHistory } from './stateUtils';

type Range = {
  start: Cursor;
  end: Cursor;
  isLinewise?: boolean;
};

type DelimitedPair = {
  open: Cursor;
  close: Cursor;
};

const isTextObjectMotion = (motion: OperatorMotion): motion is TextObject => {
  const motions: TextObject[] = [
    'iw', 'aw',
    'ip', 'ap',
    'i(', 'a(', 'i)', 'a)', 'i{', 'a{', 'i}', 'a}', 'i[', 'a[', 'i]', 'a]',
    'i"', 'a"', "i'", "a'", 'i`', 'a`'
  ];
  return motions.includes(motion as TextObject);
};

const findWordSpan = (lineText: string, col: number): { start: number; end: number } | null => {
  if (!lineText.length) return { start: 0, end: 0 };
  let idx = Math.min(col, Math.max(0, lineText.length - 1));

  // If on whitespace, move forward to next non-whitespace char
  if (isWhitespace(lineText[idx])) {
    while (idx < lineText.length && isWhitespace(lineText[idx])) {
      idx++;
    }
    if (idx >= lineText.length) return null;
  }

  const startIsWord = isWordChar(lineText[idx]);
  let start = idx;
  while (start > 0) {
    const char = lineText[start - 1];
    if (isWhitespace(char)) break;
    const charIsWord = isWordChar(char);
    if (charIsWord !== startIsWord) break;
    start--;
  }

  let end = idx;
  while (end < lineText.length) {
    const char = lineText[end];
    if (isWhitespace(char)) break;
    const charIsWord = isWordChar(char);
    if (charIsWord !== startIsWord) break;
    end++;
  }

  return { start, end };
};

const getInnerWordRange = (state: VimState): Range | null => {
  const { buffer, cursor } = state;
  const lineText = buffer[cursor.line] ?? '';
  const span = findWordSpan(lineText, cursor.col);
  if (!span) return null;
  return {
    start: { line: cursor.line, col: span.start },
    end: { line: cursor.line, col: span.end }
  };
};

const getAroundWordRange = (state: VimState): Range | null => {
  const range = getInnerWordRange(state);
  if (!range) return null;
  const lineText = state.buffer[range.start.line] ?? '';
  if (range.start.col === range.end.col && lineText.trim().length === 0) return null;
  let start = range.start.col;
  let end = range.end.col;

  while (end < lineText.length && isWhitespace(lineText[end])) end++;
  if (end === range.end.col && start > 0) {
    while (start > 0 && isWhitespace(lineText[start - 1])) start--;
  }

  return {
    start: { line: range.start.line, col: start },
    end: { line: range.end.line, col: end }
  };
};

const getParagraphRange = (state: VimState, includeBlank: boolean): Range | null => {
  const { buffer, cursor } = state;
  if (!buffer.length) return null;
  const isBlank = (line: string) => line.trim().length === 0;

  let startLine = cursor.line;
  let endLine = cursor.line;

  if (isBlank(buffer[cursor.line])) {
    if (includeBlank && buffer.length === 1) return null;
    // Blank line counts as its own paragraph
    return {
      start: { line: cursor.line, col: 0 },
      end: { line: cursor.line, col: buffer[cursor.line].length },
      isLinewise: true
    };
  }

  while (startLine > 0 && !isBlank(buffer[startLine - 1])) startLine--;
  while (endLine < buffer.length - 1 && !isBlank(buffer[endLine + 1])) endLine++;

  // For 'ap', include trailing blank line(s) but not leading ones
  if (includeBlank && endLine < buffer.length - 1 && isBlank(buffer[endLine + 1])) endLine++;

  return {
    start: { line: startLine, col: 0 },
    end: { line: endLine, col: buffer[endLine].length },
    isLinewise: true
  };
};

const comparePos = (a: Cursor, b: Cursor) => {
  if (a.line !== b.line) return a.line - b.line;
  return a.col - b.col;
};

const cursorInPair = (cursor: Cursor, pair: DelimitedPair) =>
  comparePos(cursor, pair.open) >= 0 && comparePos(cursor, pair.close) <= 0;

const isMoreInnerPair = (candidate: DelimitedPair, current: DelimitedPair) => {
  const candidateLineSpan = candidate.close.line - candidate.open.line;
  const currentLineSpan = current.close.line - current.open.line;
  if (candidateLineSpan !== currentLineSpan) {
    return candidateLineSpan < currentLineSpan;
  }
  const candidateColSpan = candidate.close.col - candidate.open.col;
  const currentColSpan = current.close.col - current.open.col;
  return candidateColSpan < currentColSpan;
};

const forwardDistance = (cursor: Cursor, target: Cursor) => {
  const lineDiff = target.line - cursor.line;
  const colDiff = target.col - cursor.col;
  const lineWeight = 10000;
  return lineDiff * lineWeight + colDiff;
};

const findDelimitedPair = (state: VimState, opening: string, closing: string): DelimitedPair | null => {
  const { buffer, cursor } = state;
  const stack: Cursor[] = [];
  let containing: DelimitedPair | null = null;
  let forward: { pair: DelimitedPair; distance: number } | null = null;

  for (let line = 0; line < buffer.length; line++) {
    const text = buffer[line] ?? '';
    for (let col = 0; col < text.length; col++) {
      const char = text[col];
      if (char === opening) {
        stack.push({ line, col });
      } else if (char === closing && stack.length > 0) {
        const openPos = stack.pop()!;
        const pair: DelimitedPair = { open: openPos, close: { line, col } };

        if (cursorInPair(cursor, pair)) {
          if (!containing || isMoreInnerPair(pair, containing)) {
            containing = pair;
          }
        } else if (comparePos(cursor, pair.open) < 0) {
          const distance = forwardDistance(cursor, pair.open);
          if (!forward || distance < forward.distance || (distance === forward.distance && isMoreInnerPair(pair, forward.pair))) {
            forward = { pair, distance };
          }
        }
      }
    }
  }

  if (containing) return containing;
  return forward ? forward.pair : null;
};

const getQuoteRange = (state: VimState, quote: string, includeDelimiters: boolean): Range | null => {
  const { buffer, cursor } = state;
  const lineText = buffer[cursor.line] ?? '';
  const searchStart = Math.min(cursor.col, Math.max(0, lineText.length - 1));

  const left = lineText.lastIndexOf(quote, searchStart);
  let right = lineText.indexOf(quote, left + 1);
  if (right !== -1 && right <= cursor.col && lineText[right] === quote) {
    right = lineText.indexOf(quote, right + 1);
  }

  if (left === -1 || right === -1 || right <= left) return null;

  return {
    start: { line: cursor.line, col: includeDelimiters ? left : left + 1 },
    end: { line: cursor.line, col: includeDelimiters ? right + 1 : right }
  };
};

const buildDelimitedRange = (
  state: VimState,
  opening: string,
  closing: string,
  includeDelimiters: boolean
): Range | null => {
  const pair = findDelimitedPair(state, opening, closing);
  if (!pair) return null;
  return {
    start: { line: pair.open.line, col: includeDelimiters ? pair.open.col : pair.open.col + 1 },
    end: { line: pair.close.line, col: includeDelimiters ? pair.close.col + 1 : pair.close.col }
  };
};

const getTextObjectRange = (state: VimState, motion: TextObject): Range | null => {
  switch (motion) {
    case 'iw':
      return getInnerWordRange(state);
    case 'aw':
      return getAroundWordRange(state);
    case 'ip':
      return getParagraphRange(state, false);
    case 'ap':
      return getParagraphRange(state, true);
    case 'i(':
    case 'i)':
    case 'a(':
    case 'a)':
      return buildDelimitedRange(state, '(', ')', motion.startsWith('a'));
    case 'i{':
    case 'i}':
    case 'a{':
    case 'a}':
      return buildDelimitedRange(state, '{', '}', motion.startsWith('a'));
    case 'i[':
    case 'i]':
    case 'a[':
    case 'a]':
      return buildDelimitedRange(state, '[', ']', motion.startsWith('a'));
    case 'i"':
    case 'a"':
      return getQuoteRange(state, '"', motion.startsWith('a'));
    case "i'":
    case "a'":
      return getQuoteRange(state, "'", motion.startsWith('a'));
    case 'i`':
    case 'a`':
      return getQuoteRange(state, '`', motion.startsWith('a'));
    default:
      return null;
  }
};

export const buildRegisterText = (buffer: string[], range: Range): string => {
  if (range.isLinewise) {
    const lines = buffer.slice(range.start.line, range.end.line + 1);
    return lines.join('\n') + '\n';
  }

  if (range.start.line === range.end.line) {
    return (buffer[range.start.line] ?? '').slice(range.start.col, range.end.col);
  }

  const parts: string[] = [];
  parts.push((buffer[range.start.line] ?? '').slice(range.start.col));
  for (let line = range.start.line + 1; line < range.end.line; line++) {
    parts.push(buffer[line] ?? '');
  }
  parts.push((buffer[range.end.line] ?? '').slice(0, range.end.col));

  if (range.start.line !== range.end.line) {
    if (parts[parts.length - 1] === '' && range.end.col === 0) {
      parts.pop();
    }
  }
  return parts.join('\n');
};

export const deleteRange = (
  buffer: string[],
  range: Range,
  preserveMultiline = false
): { buffer: string[]; cursor: Cursor } => {
  if (range.isLinewise) {
    const newBuffer = [...buffer];
    newBuffer.splice(range.start.line, range.end.line - range.start.line + 1);
    if (newBuffer.length === 0) newBuffer.push('');
    const newLine = Math.min(range.start.line, newBuffer.length - 1);
    return { buffer: newBuffer, cursor: { line: newLine, col: 0 } };
  }

  if (range.start.line === range.end.line) {
    const lineText = buffer[range.start.line] ?? '';
    const newLine = lineText.slice(0, range.start.col) + lineText.slice(range.end.col);
    const newBuffer = [...buffer];
    newBuffer[range.start.line] = newLine;
    const maxCol = Math.max(0, newLine.length - 1);
    const cursor = { line: range.start.line, col: Math.min(range.start.col, maxCol) };
    return { buffer: newBuffer, cursor };
  }

  const newBuffer = [...buffer];
  const before = (buffer[range.start.line] ?? '').slice(0, range.start.col);
  const after = (buffer[range.end.line] ?? '').slice(range.end.col);

  if (!preserveMultiline) {
    const merged = before + after;
    newBuffer.splice(range.start.line, range.end.line - range.start.line + 1, merged);
    const maxCol = Math.max(0, merged.length - 1);
    const cursor = { line: range.start.line, col: Math.min(range.start.col, maxCol) };
    return { buffer: newBuffer, cursor };
  }

  const includeAfterLine = after.length > 0;
  const replacement = includeAfterLine ? [before, after] : [before];

  newBuffer.splice(range.start.line, range.end.line - range.start.line + 1, ...replacement);
  if (newBuffer.length === 0) newBuffer.push('');

  const cursorLine = includeAfterLine ? range.start.line + 1 : range.start.line;
  const cursorLineText = replacement[includeAfterLine ? 1 : 0];
  const maxCol = Math.max(0, cursorLineText.length - 1);
  const cursor = { line: cursorLine, col: Math.min(range.start.col, maxCol) };
  return { buffer: newBuffer, cursor };
};

export const applyOperatorWithFindMotion = (
  state: VimState,
  operator: Operator,
  targetCol: number
): VimState => {
  const { cursor, buffer } = state;

  // Build range from cursor to targetCol (inclusive)
  const start = cursor.col;
  const end = targetCol;

  let rangeStart: number;
  let rangeEnd: number;

  if (start <= end) {
    rangeStart = start;
    rangeEnd = end + 1; // Inclusive, so we need +1 for slice
  } else {
    rangeStart = end;
    rangeEnd = start + 1;
  }

  const lineText = buffer[cursor.line];
  const range: Range = {
    start: { line: cursor.line, col: rangeStart },
    end: { line: cursor.line, col: rangeEnd }
  };

  const registerText = buildRegisterText(buffer, range);

  if (operator === 'y') {
    return {
      ...state,
      register: registerText,
      pendingOperator: null,
      pendingFind: null,
      lastCommand: { type: 'yank' }
    };
  }

  const stateWithHistory = pushHistory(state);
  const newBuffer = [...buffer];
  const newLine = lineText.slice(0, rangeStart) + lineText.slice(rangeEnd);
  newBuffer[cursor.line] = newLine;

  let newCursorCol: number;
  let insertCol: number | undefined;

  if (operator === 'c') {
    if (newLine.length === 0) {
      newCursorCol = 0;
      insertCol = 0;
    } else {
      const maxCursor = Math.max(0, newLine.length - 1);
      newCursorCol = Math.min(rangeStart, maxCursor);
      insertCol = Math.min(rangeStart, newLine.length);
    }
  } else {
    const maxCursor = Math.max(0, newLine.length - 1);
    newCursorCol = Math.min(rangeStart, maxCursor);
  }

  return {
    ...stateWithHistory,
    buffer: newBuffer,
    cursor: { line: cursor.line, col: newCursorCol },
    pendingOperator: null,
    pendingFind: null,
    mode: operator === 'c' ? 'insert' : 'normal',
    register: registerText,
    insertCol,
    insertStart: operator === 'c' ? { line: cursor.line, col: insertCol ?? newCursorCol } : state.insertStart,
    lastCommand: { type: 'delete-range', operator }
  };
};

export const applyOperatorWithMotion = (
  state: VimState,
  operator: Operator,
  motion: OperatorMotion
): VimState => {
  if (isTextObjectMotion(motion)) {
    const range = getTextObjectRange(state, motion);
    if (!range) {
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

    const registerText = buildRegisterText(state.buffer, range);

    if (operator === 'y') {
      let cursor = state.cursor;
      if (range.isLinewise) {
        cursor = { line: range.start.line, col: 0 };
      } else if (
        range.start.line !== range.end.line &&
        range.start.col >= (state.buffer[range.start.line]?.length ?? 0)
      ) {
        cursor = { line: Math.min(range.start.line + 1, state.buffer.length - 1), col: 0 };
      } else {
        cursor = { ...range.start };
      }
      return {
        ...state,
        register: registerText,
        pendingOperator: null,
        pendingTextObject: null,
        lastCommand: { type: 'yank' },
        cursor
      };
    }

    const historyState = {
      ...state,
      cursor: range.isLinewise ? { line: range.start.line, col: 0 } : { ...range.start }
    };
    const stateWithHistory = pushHistory(historyState, true);
    const { buffer: deletedBuffer, cursor } = deleteRange(stateWithHistory.buffer, range, true);
    let buffer = deletedBuffer;
    let nextCursor = cursor;
    let recordingExitCursor: Cursor | null = null;

    if (range.isLinewise) {
      const lineText = buffer[nextCursor.line] ?? '';
      const maxCol = Math.max(0, lineText.length - 1);
      nextCursor = { line: nextCursor.line, col: Math.min(state.cursor.col, maxCol) };
    }

    const isMultiline = range.start.line !== range.end.line;
    let insertCol: number | undefined;

    if (operator === 'c' && range.isLinewise) {
      const hasFollowingLine = buffer.length > range.start.line + 1;
      const mutable = [...buffer];
      if (hasFollowingLine || mutable.length === 0) {
        mutable.splice(range.start.line, 0, '');
      }
      buffer = mutable;
      nextCursor = { line: range.start.line, col: 0 };
      insertCol = 0;
    }

    const isInnerDelimited = operator === 'c'
      && isMultiline
      && !range.isLinewise
      && motion.startsWith('i')
      && ['(', '{', '['].includes(motion.charAt(1));

    if (isInnerDelimited && buffer.length > range.start.line + 1) {
      const indentSource = stateWithHistory.buffer[Math.min(range.start.line + 1, stateWithHistory.buffer.length - 1)] ?? '';
      const indentMatch = indentSource.match(/^\s*/);
      const indent = indentMatch ? indentMatch[0] : '';
      buffer = [...buffer];
      buffer.splice(range.start.line + 1, 0, indent);
      nextCursor = { line: range.start.line + 1, col: Math.max(0, indent.length - 1) };
      insertCol = indent.length;
    }

    if (operator === 'c' && insertCol === undefined) {
      const targetCol = range.isLinewise ? state.cursor.col : range.start.col;
      const lineText = buffer[nextCursor.line] ?? '';
      const maxCursor = Math.max(0, lineText.length - 1);
      nextCursor = { line: nextCursor.line, col: Math.min(targetCol, maxCursor) };
      insertCol = Math.min(targetCol, lineText.length);
    }

    if (operator === 'd' && recordingExitCursor === null) {
      recordingExitCursor = range.isLinewise
        ? { line: range.start.line, col: 0 }
        : { ...nextCursor };
    }

    const nextState: VimState = {
      ...stateWithHistory,
      buffer,
      cursor: nextCursor,
      pendingOperator: null,
      pendingTextObject: null,
      mode: operator === 'c' ? 'insert' : 'normal',
      register: registerText,
      insertCol,
      insertStart: operator === 'c' ? { ...nextCursor } : state.insertStart,
      recordingExitCursor: recordingExitCursor ?? stateWithHistory.recordingExitCursor,
      lastCommand: { type: 'delete-range', operator, motion },
      count: ''
    };

    if (operator === 'd') {
      return finishRecording(nextState);
    }

    return nextState;
  }

  const { buffer, cursor } = state;
  const originalCursor = cursor;

  // Special case: cw and cW behave like ce/cE when cursor is on a word character
  // This matches Vim's behavior where cw doesn't include trailing whitespace
  let actualMotion = motion;
  const startChar = buffer[cursor.line]?.[cursor.col] ?? '';
  if (operator === 'c' && motion === 'w' && !isWhitespace(startChar)) {
    actualMotion = 'e';
  }
  if (operator === 'c' && motion === 'W' && !isWhitespace(startChar)) {
    actualMotion = 'E';
  }

  // When cw starts on punctuation, Vim only changes that punctuation run instead of jumping into the next word.
  if (operator === 'c' && motion === 'w' && !isWhitespace(startChar) && !isWordChar(startChar)) {
    const lineText = buffer[cursor.line] ?? '';
    const span = findWordSpan(lineText, cursor.col);
    const endCol = span ? span.end : cursor.col + 1;
    const registerText = lineText.slice(cursor.col, endCol);

    const stateWithHistory = pushHistory(state);
    const newLine = lineText.slice(0, cursor.col) + lineText.slice(endCol);
    const newBuffer = [...buffer];
    newBuffer[cursor.line] = newLine;
    const maxCursor = Math.max(0, newLine.length - 1);
    const newCursorCol = Math.min(cursor.col, maxCursor);

    return {
      ...stateWithHistory,
      buffer: newBuffer,
      cursor: { line: cursor.line, col: newCursorCol },
      pendingOperator: null,
      pendingTextObject: null,
      mode: 'insert',
      register: registerText,
      insertCol: Math.min(cursor.col, newLine.length),
      insertStart: { line: cursor.line, col: Math.min(cursor.col, newLine.length) },
      lastCommand: { type: 'delete-range', operator, motion }
    };
  }

  const target = getMotionTarget(state, actualMotion, true);

  let start = cursor;
  let end = target;

   // If we're changing a word from a whitespace position, keep the range empty
  if (operator === 'c' && motion === 'w' && isWhitespace(startChar)) {
    end = start;
  }

  if (start.line > end.line || (start.line === end.line && start.col > end.col)) {
    [start, end] = [end, start];
  }

  // For dw/cw that would cross lines, truncate to EOL (Vim behavior)
  if (start.line !== end.line && (motion === 'w' || motion === 'W')) {
    end = { line: start.line, col: buffer[start.line].length };
  }

  if (start.line === end.line) {
    const lineText = buffer[start.line];

    // Determine if motion is inclusive (should include the target character)
    // In Vim: $ and e/E are inclusive for operator ranges
    const inclusiveMotions: Motion[] = ['$', 'e', 'E'];
    const isInclusive = inclusiveMotions.includes(actualMotion);

    // For inclusive motions, include the target character
    const endCol = isInclusive ? Math.min(end.col + 1, lineText.length) : end.col;
    const registerText = lineText.slice(start.col, endCol);

    if (operator === 'y') {
      // Yank: copy to register, don't modify buffer
      return {
        ...state,
        register: registerText,
        pendingOperator: null,
        pendingTextObject: null,
        lastCommand: { type: 'yank' }
      };
    }

    // Delete or Change: modify buffer
    const stateWithHistory = pushHistory(state);
    const newBuffer = [...buffer];
    const newLine = lineText.slice(0, start.col) + lineText.slice(endCol);
    newBuffer[start.line] = newLine;

    // Calculate cursor position and insert position
    let newCursorCol: number;
    let insertCol: number | undefined;

    if (operator === 'c') {
      // For change operator entering Insert mode
      if (newLine.length === 0) {
        // Empty line: cursor and insertion point both at 0
        newCursorCol = 0;
        insertCol = 0;
      } else if (motion === '$') {
        // Special case for c$: cursor on last char, insertion point after it
        newCursorCol = newLine.length - 1;
        insertCol = newLine.length;
      } else {
        // General case (cw, ce, etc.): cursor and insertion at deletion point
        const maxCursor = Math.max(0, newLine.length - 1);
        newCursorCol = Math.min(start.col, maxCursor);
        insertCol = Math.min(start.col, newLine.length);  // insertCol can be 0..len
      }
    } else {
      // For delete operator staying in Normal mode
      const maxCursor = Math.max(0, newLine.length - 1);
      newCursorCol = Math.min(start.col, maxCursor);
    }

    return {
      ...stateWithHistory,
      buffer: newBuffer,
      cursor: { line: start.line, col: newCursorCol },
      pendingOperator: null,
      pendingTextObject: null,
      mode: operator === 'c' ? 'insert' : 'normal',
      register: registerText,
      insertCol,
      insertStart: operator === 'c' ? { line: start.line, col: insertCol ?? newCursorCol } : state.insertStart,
      recordingExitCursor: operator === 'd'
        ? { line: start.line, col: newCursorCol }
        : stateWithHistory.recordingExitCursor,
      lastCommand: { type: 'delete-range', operator, motion }
    };
  }

  return state;
};
