import type { VimState, Cursor, Motion } from './types';
import { isWhitespace, isWordChar } from './utils';

type WordCategory = 'space' | 'word' | 'other';

const getSmallWordCategory = (char: string | null): WordCategory => {
  if (char === null || isWhitespace(char)) return 'space';
  return isWordChar(char) ? 'word' : 'other';
};

const getBigWordCategory = (char: string | null): 'space' | 'word' => {
  if (char === null || isWhitespace(char)) return 'space';
  return 'word';
};

const clampCursor = (buffer: string[], cursor: Cursor): Cursor => {
  if (buffer.length === 0) return { line: 0, col: 0 };
  const line = Math.max(0, Math.min(cursor.line, buffer.length - 1));
  const lineText = buffer[line] ?? '';
  if (lineText.length === 0) return { line, col: 0 };
  return { line, col: Math.max(0, Math.min(cursor.col, lineText.length - 1)) };
};

const moveToNextRunEnd = (
  buffer: string[],
  start: Cursor,
  getCategory: (char: string | null) => WordCategory | 'space' | 'word',
  advanceFromBoundary = true
): Cursor => {
  let { line, col } = clampCursor(buffer, start);

  const stepForward = () => {
    col++;
    while (line < buffer.length && col >= (buffer[line]?.length ?? 0)) {
      line++;
      col = 0;
    }
  };

  const currentChar = (): string | null => {
    if (line >= buffer.length) return null;
    const text = buffer[line] ?? '';
    if (text.length === 0 || col >= text.length) return null;
    return text[col];
  };

  const skipWhitespace = () => {
    while (line < buffer.length) {
      const text = buffer[line] ?? '';
      if (text.length === 0 || col >= text.length) {
        line++;
        col = 0;
        continue;
      }
      if (!isWhitespace(text[col])) break;
      stepForward();
    }
  };

  const walkToRunEnd = (category: ReturnType<typeof getCategory>) => {
    while (line < buffer.length) {
      const text = buffer[line] ?? '';
      const nextLine = line;
      const nextCol = col + 1;

      if (nextCol < text.length) {
        const nextChar = text[nextCol];
        const nextCategory = getCategory(nextChar);
        if (nextCategory !== category) break;
        line = nextLine;
        col = nextCol;
        continue;
      }

      // End of line counts as whitespace for both word/WORD motions
      break;
    }
  };

  const moveToFallbackEnd = (): Cursor => {
    const lastLine = Math.max(0, buffer.length - 1);
    const lastText = buffer[lastLine] ?? '';
    if (lastText.length === 0) return { line: lastLine, col: 0 };
    return { line: lastLine, col: lastText.length - 1 };
  };

  let category = getCategory(currentChar());

  if (category === 'space') {
    skipWhitespace();
    if (line >= buffer.length) return moveToFallbackEnd();
    category = getCategory(currentChar());
  } else {
    // Already on a non-space char; if we're at the end of this run, optionally jump to the end of the next run.
    const text = buffer[line] ?? '';
    const nextChar = col + 1 < text.length ? text[col + 1] : null;
    const nextCategory = getCategory(nextChar);
    const atRunEnd = nextCategory !== category;
    if (atRunEnd && advanceFromBoundary) {
      stepForward();
      skipWhitespace();
      if (line >= buffer.length) return moveToFallbackEnd();
      category = getCategory(currentChar());
    }
  }

  walkToRunEnd(category);
  return clampCursor(buffer, { line, col });
};

// Find character on current line
export const findCharOnLine = (
  line: string,
  startCol: number,
  char: string,
  findType: 'f' | 'F' | 't' | 'T'
): number | null => {
  if (findType === 'f') {
    // Find forward: search from startCol + 1 to end
    for (let i = startCol + 1; i < line.length; i++) {
      if (line[i] === char) return i;
    }
  } else if (findType === 'F') {
    // Find backward: search from startCol - 1 to start
    for (let i = startCol - 1; i >= 0; i--) {
      if (line[i] === char) return i;
    }
  } else if (findType === 't') {
    // Till forward: search from startCol + 1, return position before char
    for (let i = startCol + 1; i < line.length; i++) {
      if (line[i] === char) return i - 1;
    }
  } else if (findType === 'T') {
    // Till backward: search from startCol - 1, return position after char
    for (let i = startCol - 1; i >= 0; i--) {
      if (line[i] === char) return i + 1;
    }
  }
  return null;
};

export const getMotionTarget = (state: VimState, motion: Motion, forOperator = false): Cursor => {
  const { buffer, cursor } = state;
  const { line, col } = cursor;
  const currentLine = buffer[line] || '';

  switch (motion) {
    case 'h':
      return { line, col: Math.max(0, col - 1) };

    case 'l':
      return { line, col: Math.min(Math.max(0, currentLine.length - 1), col + 1) };

    case 'j': {
      const nextLineIdx = Math.min(buffer.length - 1, line + 1);
      const nextLineLen = buffer[nextLineIdx].length;
      return { line: nextLineIdx, col: Math.min(col, Math.max(0, nextLineLen - 1)) };
    }

    case 'k': {
      const prevLineIdx = Math.max(0, line - 1);
      const prevLineLen = buffer[prevLineIdx].length;
      return { line: prevLineIdx, col: Math.min(col, Math.max(0, prevLineLen - 1)) };
    }

    case '0':
      return { line, col: 0 };

    case '$':
      return { line, col: Math.max(0, currentLine.length - 1) };

    case '^':
    case '_': {
      let firstNonBlank = 0;
      for (let i = 0; i < currentLine.length; i++) {
        if (!isWhitespace(currentLine[i])) {
          firstNonBlank = i;
          break;
        }
      }
      return { line, col: firstNonBlank };
    }

    case 'w': {
      let r = line, c = col;
      const lastLineIdx = Math.max(0, buffer.length - 1);
      const lastLine = buffer[lastLineIdx] ?? '';
      const fallback: Cursor = {
        line: lastLineIdx,
        col: forOperator ? lastLine.length : Math.max(0, lastLine.length - 1)
      };

      if (r >= buffer.length) return fallback;
      const currentLineText = buffer[r] ?? '';
      const lineLen = currentLineText.length;
      const startedOnWhitespace = lineLen === 0 || isWhitespace(currentLineText[c] ?? '');
      if (lineLen === 0) {
        c = 0;
      } else if (c >= lineLen) {
        return fallback;
      }

      const startChar = buffer[r][c] ?? '';
      const startIsWhite = startedOnWhitespace;
      const startIsWord = isWordChar(startChar);
      const startCategory = startIsWord ? 'word' : 'other';

      // Skip current word or punctuation
      if (!startIsWhite) {
        while (r < buffer.length && c < buffer[r].length) {
          const char = buffer[r][c];
          if (isWhitespace(char)) break;

          const charIsWord = isWordChar(char);
          const charCategory = charIsWord ? 'word' : 'other';

          // If we started on word char, skip while still on word chars
          // If we started on punctuation, skip while still on punctuation
          if (startCategory !== charCategory) break;

          c++;
          if (c >= buffer[r].length) {
            r++;
            c = 0;
            break;
          }
        }
      }

      // Skip whitespace
      const stopOnEmptyLine = !startedOnWhitespace;
      while (r < buffer.length) {
        const lineText = buffer[r] ?? '';
        if (lineText.length === 0) {
          if (stopOnEmptyLine) return { line: r, col: 0 };
          r++;
          c = 0;
          if (r >= buffer.length) break;
          continue;
        }
        if (c >= buffer[r].length) {
          r++;
          c = 0;
          if (r >= buffer.length) break;
          continue;
        }

        const char = lineText[c];
        if (!isWhitespace(char)) break;

        c++;
      }

      if (r >= buffer.length) {
        // No next word found
        return startIsWhite ? cursor : fallback;
      }
      const maxCol = forOperator ? buffer[r].length : Math.max(0, buffer[r].length - 1);
      return { line: r, col: Math.min(c, maxCol) };
    }

    case 'b': {
      let r = line, c = col;

      if (r < 0 || c < 0) return cursor;

      // Move back one position first
      c--;
      if (c < 0) {
        r--;
        if (r < 0) return { line: 0, col: 0 };
        c = buffer[r].length - 1;
      }

      // Skip whitespace backwards
      while (r >= 0) {
        if (c < 0) {
          r--;
          if (r < 0) return { line: 0, col: 0 };
          c = buffer[r].length - 1;
          continue;
        }

        const char = buffer[r][c];
        if (!isWhitespace(char)) break;

        c--;
      }

      if (r < 0) return { line: 0, col: 0 };

      // Now we're on a non-whitespace char, find the start of this word/punctuation
      const targetChar = buffer[r][c];
      const targetIsWord = isWordChar(targetChar);

      while (r >= 0) {
        if (c < 0) {
          r--;
          if (r < 0) return { line: 0, col: 0 };
          c = buffer[r].length - 1;
          if (c < 0) return { line: 0, col: 0 };
        }

        const char = buffer[r][c];
        if (isWhitespace(char)) {
          // Hit whitespace, move forward one step
          c++;
          if (c >= buffer[r].length) {
            r++;
            c = 0;
          }
          break;
        }

        const charIsWord = isWordChar(char);
        if (targetIsWord !== charIsWord) {
          // Hit different type, move forward one step
          c++;
          if (c >= buffer[r].length) {
            r++;
            c = 0;
          }
          break;
        }

        // Check if we're at the start of the word
        if (c === 0) {
          // At start of line
          break;
        }

        const prevChar = buffer[r][c - 1];
        if (isWhitespace(prevChar)) {
          // Previous char is whitespace, we're at word start
          break;
        }

        const prevIsWord = isWordChar(prevChar);
        if (targetIsWord !== prevIsWord) {
          // Previous char is different type, we're at word start
          break;
        }

        c--;
      }

      if (r < 0) return { line: 0, col: 0 };
      return { line: r, col: Math.max(0, c) };
    }

    case 'e':
      return moveToNextRunEnd(buffer, cursor, getSmallWordCategory, !forOperator);

    case 'W': {
      let r = line, c = col;

      const lastLineIdx = Math.max(0, buffer.length - 1);
      const lastLine = buffer[lastLineIdx] ?? '';
      const fallback: Cursor = {
        line: lastLineIdx,
        col: forOperator ? lastLine.length : Math.max(0, lastLine.length - 1)
      };

      if (r >= buffer.length || c >= buffer[r].length) return fallback;

      const startChar = buffer[r][c];
      const startIsWhite = isWhitespace(startChar);

      // Skip current WORD (any non-whitespace)
      if (!startIsWhite) {
        while (r < buffer.length && c < buffer[r].length) {
          const char = buffer[r][c];
          if (isWhitespace(char)) break;

          c++;
          if (c >= buffer[r].length) {
            r++;
            c = 0;
            break;
          }
        }
      }

      // Skip whitespace; stop at empty lines so WORD motion can land on blanks
      while (r < buffer.length) {
        const lineText = buffer[r] ?? '';
        if (lineText.length === 0) {
          return { line: r, col: 0 };
        }

        if (c >= lineText.length) {
          r++;
          c = 0;
          continue;
        }

        if (!isWhitespace(lineText[c])) break;

        while (c < lineText.length && isWhitespace(lineText[c])) {
          c++;
        }

        if (c >= lineText.length) {
          r++;
          c = 0;
          continue;
        }
      }

      if (r >= buffer.length) {
        return startIsWhite ? cursor : fallback;
      }
      const maxCol = forOperator ? buffer[r].length : Math.max(0, buffer[r].length - 1);
      return { line: r, col: Math.min(c, maxCol) };
    }

    case 'B': {
      let r = line, c = col;

      if (r < 0 || c < 0) return cursor;

      // Move back one position first
      c--;
      if (c < 0) {
        r--;
        if (r < 0) return { line: 0, col: 0 };
        c = buffer[r].length - 1;
      }

      // Skip whitespace backwards; stop on empty lines so WORD motion can land on blanks
      while (r >= 0) {
        const lineText = buffer[r] ?? '';
        if (lineText.length === 0) {
          return { line: r, col: 0 };
        }

        if (c < 0) {
          r--;
          if (r < 0) return { line: 0, col: 0 };
          c = buffer[r].length - 1;
          continue;
        }

        const char = lineText[c];
        if (!isWhitespace(char)) break;

        c--;
      }

      if (r < 0) return { line: 0, col: 0 };

      // Now we're on a non-whitespace char, find the start of this WORD
      while (r >= 0) {
        if (c === 0) {
          // At start of line
          break;
        }

        const prevChar = buffer[r][c - 1];
        if (isWhitespace(prevChar)) {
          // Previous char is whitespace, we're at WORD start
          break;
        }

        c--;
        if (c < 0) {
          r--;
          if (r < 0) return { line: 0, col: 0 };
          c = buffer[r].length - 1;
        }
      }

      if (r < 0) return { line: 0, col: 0 };
      return { line: r, col: Math.max(0, c) };
    }

    case 'E':
      return moveToNextRunEnd(buffer, cursor, getBigWordCategory, !forOperator);

    default:
      return cursor;
  }
};
