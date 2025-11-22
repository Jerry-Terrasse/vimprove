import type { VimState, Operator, Motion, OperatorMotion, TextObject, Cursor } from './types';
import { getMotionTarget } from './motions';
import { clampCursor, isWhitespace, isWordChar } from './utils';
import { pushHistory } from './stateUtils';

type Range = {
  start: Cursor;
  end: Cursor;
  isLinewise?: boolean;
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
    // Blank line counts as its own paragraph
    return {
      start: { line: cursor.line, col: 0 },
      end: { line: cursor.line, col: buffer[cursor.line].length },
      isLinewise: true
    };
  }

  while (startLine > 0 && !isBlank(buffer[startLine - 1])) startLine--;
  while (endLine < buffer.length - 1 && !isBlank(buffer[endLine + 1])) endLine++;

  if (includeBlank && startLine > 0 && isBlank(buffer[startLine - 1])) startLine--;
  if (includeBlank && endLine < buffer.length - 1 && isBlank(buffer[endLine + 1])) endLine++;

  return {
    start: { line: startLine, col: 0 },
    end: { line: endLine, col: buffer[endLine].length },
    isLinewise: true
  };
};

const findEnclosingPair = (state: VimState, opening: string, closing: string): { open: Cursor; close: Cursor } | null => {
  const { buffer, cursor } = state;
  let depth = 0;
  let openPos: Cursor | null = null;
  let closePos: Cursor | null = null;

  for (let line = cursor.line; line >= 0; line--) {
    const text = buffer[line];
    const startCol = line === cursor.line ? cursor.col : text.length - 1;
    for (let col = startCol; col >= 0; col--) {
      const char = text[col];
      if (char === closing) depth++;
      if (char === opening) {
        if (depth === 0) {
          openPos = { line, col };
          line = -1;
          break;
        }
        depth--;
      }
    }
  }

  depth = 0;
  for (let line = cursor.line; line < buffer.length; line++) {
    const text = buffer[line];
    const startCol = line === cursor.line ? cursor.col : 0;
    for (let col = startCol; col < text.length; col++) {
      const char = text[col];
      if (char === opening) depth++;
      if (char === closing) {
        if (depth === 0) {
          closePos = { line, col };
          line = buffer.length;
          break;
        }
        depth--;
      }
    }
  }

  if (openPos && closePos) {
    return { open: openPos, close: closePos };
  }
  return null;
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
      return (() => {
        const pair = findEnclosingPair(state, '(', ')');
        if (!pair) return null;
        const include = motion.startsWith('a');
        return {
          start: { line: pair.open.line, col: include ? pair.open.col : pair.open.col + 1 },
          end: { line: pair.close.line, col: include ? pair.close.col + 1 : pair.close.col }
        };
      })();
    case 'i{':
    case 'i}':
    case 'a{':
    case 'a}':
      return (() => {
        const pair = findEnclosingPair(state, '{', '}');
        if (!pair) return null;
        const include = motion.startsWith('a');
        return {
          start: { line: pair.open.line, col: include ? pair.open.col : pair.open.col + 1 },
          end: { line: pair.close.line, col: include ? pair.close.col + 1 : pair.close.col }
        };
      })();
    case 'i[':
    case 'i]':
    case 'a[':
    case 'a]':
      return (() => {
        const pair = findEnclosingPair(state, '[', ']');
        if (!pair) return null;
        const include = motion.startsWith('a');
        return {
          start: { line: pair.open.line, col: include ? pair.open.col : pair.open.col + 1 },
          end: { line: pair.close.line, col: include ? pair.close.col + 1 : pair.close.col }
        };
      })();
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

const buildRegisterText = (buffer: string[], range: Range): string => {
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
  return parts.join('\n');
};

const deleteRange = (buffer: string[], range: Range): { buffer: string[]; cursor: Cursor } => {
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
    const cursor = clampCursor({ line: range.start.line, col: range.start.col }, newBuffer);
    return { buffer: newBuffer, cursor };
  }

  const newBuffer = [...buffer];
  const before = (buffer[range.start.line] ?? '').slice(0, range.start.col);
  const after = (buffer[range.end.line] ?? '').slice(range.end.col);
  const merged = before + after;
  newBuffer.splice(range.start.line, range.end.line - range.start.line + 1, merged);
  const cursor = clampCursor({ line: range.start.line, col: range.start.col }, newBuffer);
  return { buffer: newBuffer, cursor };
};

export const applyOperatorWithMotion = (
  state: VimState,
  operator: Operator,
  motion: OperatorMotion
): VimState => {
  if (isTextObjectMotion(motion)) {
    const range = getTextObjectRange(state, motion);
    if (!range) {
      return { ...state, pendingOperator: null, pendingTextObject: null };
    }

    const registerText = buildRegisterText(state.buffer, range);

    if (operator === 'y') {
      return {
        ...state,
        register: registerText,
        pendingOperator: null,
        pendingTextObject: null,
        lastCommand: { type: 'yank' }
      };
    }

    const stateWithHistory = pushHistory(state);
    const { buffer, cursor } = deleteRange(stateWithHistory.buffer, range);

    return {
      ...stateWithHistory,
      buffer,
      cursor,
      pendingOperator: null,
      pendingTextObject: null,
      mode: operator === 'c' ? 'insert' : 'normal',
      register: registerText,
      lastCommand: { type: 'delete-range', operator, motion }
    };
  }

  const { buffer, cursor } = state;
  const target = getMotionTarget(state, motion, true);

  let start = cursor;
  let end = target;

   // If we're changing a word from a whitespace position, keep the range empty
  const startChar = buffer[start.line]?.[start.col] ?? '';
  if (operator === 'c' && motion === 'w' && isWhitespace(startChar)) {
    end = start;
  }

  if (start.line > end.line || (start.line === end.line && start.col > end.col)) {
    [start, end] = [end, start];
  }

  if (start.line === end.line) {
    const lineText = buffer[start.line];

    // Determine if motion is inclusive (should include the target character)
    // In Vim: $ and e/E are inclusive for operator ranges
    const inclusiveMotions: Motion[] = ['$', 'e', 'E'];
    const isInclusive = inclusiveMotions.includes(motion);

    // For inclusive motions, include the target character
    const endCol = isInclusive ? Math.min(end.col + 1, lineText.length) : end.col;
    const yankedText = lineText.slice(start.col, endCol);
    const registerText = operator === 'y' && motion === 'w' && endCol === lineText.length
      ? `${yankedText} `
      : yankedText;

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
    const maxCursor = operator === 'c' ? newLine.length : Math.max(0, newLine.length - 1);
    const newCursorCol = Math.min(start.col, maxCursor);

    return {
      ...stateWithHistory,
      buffer: newBuffer,
      cursor: { line: start.line, col: newCursorCol },
      pendingOperator: null,
      pendingTextObject: null,
      mode: operator === 'c' ? 'insert' : 'normal',
      register: registerText,
      lastCommand: { type: 'delete-range', operator, motion }
    };
  }

  return state;
};
