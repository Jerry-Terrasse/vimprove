import type { VimState, Cursor, Motion } from './types';
import { isWhitespace, isWordChar } from './utils';

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

      if (r >= buffer.length || c >= buffer[r].length) return fallback;

      const startChar = buffer[r][c];
      const startIsWord = isWordChar(startChar);
      const startIsWhite = isWhitespace(startChar);

      // Skip current word or punctuation
      if (!startIsWhite) {
        while (r < buffer.length && c < buffer[r].length) {
          const char = buffer[r][c];
          const charIsWord = isWordChar(char);

          // If we started on word char, skip while still on word chars
          // If we started on punctuation, skip while still on punctuation
          if (startIsWord !== charIsWord) break;

          c++;
          if (c >= buffer[r].length) {
            r++;
            c = 0;
            break;
          }
        }
      }

      // Skip whitespace
      while (r < buffer.length) {
        if (c >= buffer[r].length) {
          r++;
          c = 0;
          if (r >= buffer.length) break;
          continue;
        }

        const char = buffer[r][c];
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

    case 'e': {
      let r = line, c = col;

      if (r >= buffer.length) return cursor;
      if (c >= buffer[r].length) {
        c = buffer[r].length - 1;
      }

      // Move forward one position first
      c++;
      if (c >= buffer[r].length) {
        r++;
        c = 0;
        if (r >= buffer.length) return cursor;
      }

      // Skip whitespace
      while (r < buffer.length) {
        if (c >= buffer[r].length) {
          r++;
          c = 0;
          if (r >= buffer.length) return cursor;
          continue;
        }

        const char = buffer[r][c];
        if (!isWhitespace(char)) break;

        c++;
      }

      if (r >= buffer.length) return cursor;

      // Now find the end of the current word/punctuation
      const targetChar = buffer[r][c];
      const targetIsWord = isWordChar(targetChar);

      while (r < buffer.length) {
        if (c >= buffer[r].length) {
          r++;
          c = 0;
          if (r >= buffer.length) break;
          continue;
        }

        // Check next character
        const nextC = c + 1;
        if (nextC >= buffer[r].length) {
          // At end of line, this is the end
          return { line: r, col: c };
        }

        const nextChar = buffer[r][nextC];
        if (isWhitespace(nextChar)) {
          // Next char is whitespace, this is the end
          return { line: r, col: c };
        }

        const nextIsWord = isWordChar(nextChar);
        if (targetIsWord !== nextIsWord) {
          // Next char is different type, this is the end
          return { line: r, col: c };
        }

        c++;
      }

      if (r >= buffer.length) return cursor;
      return { line: r, col: Math.max(0, Math.min(c, buffer[r].length - 1)) };
    }

    case 'W': {
      let r = line, c = col;

      if (r >= buffer.length || c >= buffer[r].length) return cursor;

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

      // Skip whitespace
      while (r < buffer.length) {
        if (c >= buffer[r].length) {
          r++;
          c = 0;
          if (r >= buffer.length) break;
          continue;
        }

        const char = buffer[r][c];
        if (!isWhitespace(char)) break;

        c++;
      }

      if (r >= buffer.length) return cursor;
      return { line: r, col: Math.min(c, Math.max(0, buffer[r].length - 1)) };
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

    case 'E': {
      let r = line, c = col;

      if (r >= buffer.length) return cursor;
      if (c >= buffer[r].length) {
        c = buffer[r].length - 1;
      }

      // Move forward one position first
      c++;
      if (c >= buffer[r].length) {
        r++;
        c = 0;
        if (r >= buffer.length) return cursor;
      }

      // Skip whitespace
      while (r < buffer.length) {
        if (c >= buffer[r].length) {
          r++;
          c = 0;
          if (r >= buffer.length) return cursor;
          continue;
        }

        const char = buffer[r][c];
        if (!isWhitespace(char)) break;

        c++;
      }

      if (r >= buffer.length) return cursor;

      // Now find the end of the current WORD
      while (r < buffer.length) {
        if (c >= buffer[r].length) {
          r++;
          c = 0;
          if (r >= buffer.length) break;
          continue;
        }

        // Check next character
        const nextC = c + 1;
        if (nextC >= buffer[r].length) {
          // At end of line, this is the end
          return { line: r, col: c };
        }

        const nextChar = buffer[r][nextC];
        if (isWhitespace(nextChar)) {
          // Next char is whitespace, this is the end
          return { line: r, col: c };
        }

        c++;
      }

      if (r >= buffer.length) return cursor;
      return { line: r, col: Math.max(0, Math.min(c, buffer[r].length - 1)) };
    }

    default:
      return cursor;
  }
};
