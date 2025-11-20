import type { VimState, Cursor, Motion } from './types';
import { isWhitespace } from './utils';

export const getMotionTarget = (state: VimState, motion: Motion): Cursor => {
  const { buffer, cursor } = state;
  const { line, col } = cursor;
  const currentLine = buffer[line] || '';

  switch (motion) {
    case 'h':
      return { line, col: Math.max(0, col - 1) };

    case 'l':
      return { line, col: Math.min(currentLine.length - 1, col + 1) };

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

    case '^': {
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
      c++;
      if (c >= buffer[r].length) {
        r++; c = 0;
      }

      while (r < buffer.length) {
        const char = buffer[r][c];
        if (char && !isWhitespace(char)) {
          break;
        }
        c++;
        if (c >= buffer[r].length) {
          r++; c = 0;
        }
      }
      if (r >= buffer.length) return cursor;
      return { line: r, col: c };
    }

    case 'b': {
      let r = line, c = col;
      c--;
      while (r >= 0) {
        if (c < 0) {
          r--;
          if (r >= 0) c = buffer[r].length - 1;
          continue;
        }
        const char = buffer[r][c];
        const prevChar = c > 0 ? buffer[r][c - 1] : ' ';
        if (!isWhitespace(char) && isWhitespace(prevChar)) {
          break;
        }
        c--;
      }
      if (r < 0) return { line: 0, col: 0 };
      return { line: r, col: c };
    }

    case 'e': {
      let r = line, c = col;
      const onWord = !isWhitespace(buffer[r][c] || ' ');

      if (onWord) {
        c++;
        while (r < buffer.length && c < buffer[r].length) {
          if (isWhitespace(buffer[r][c])) break;
          c++;
        }
        c--;
      }

      if (c >= buffer[r].length || isWhitespace(buffer[r][c] || ' ')) {
        c++;
        while (r < buffer.length) {
          while (c < buffer[r].length && isWhitespace(buffer[r][c])) {
            c++;
          }
          if (c < buffer[r].length) break;
          r++;
          c = 0;
        }

        if (r >= buffer.length) return cursor;

        while (c < buffer[r].length && !isWhitespace(buffer[r][c])) {
          c++;
        }
        c--;
      }

      return { line: r, col: Math.max(0, c) };
    }

    case 'W': {
      let r = line, c = col;
      c++;
      while (r < buffer.length) {
        while (c < buffer[r].length && !isWhitespace(buffer[r][c])) {
          c++;
        }
        while (c < buffer[r].length && isWhitespace(buffer[r][c])) {
          c++;
        }
        if (c < buffer[r].length) break;
        r++;
        c = 0;
        if (r < buffer.length && buffer[r].length > 0 && !isWhitespace(buffer[r][0])) {
          break;
        }
      }
      if (r >= buffer.length) return cursor;
      return { line: r, col: c };
    }

    case 'B': {
      let r = line, c = col;
      c--;
      while (r >= 0) {
        if (c < 0) {
          r--;
          if (r >= 0) c = buffer[r].length - 1;
          continue;
        }
        const char = buffer[r][c];
        const prevChar = c > 0 ? buffer[r][c - 1] : ' ';
        if (!isWhitespace(char) && isWhitespace(prevChar)) {
          break;
        }
        c--;
      }
      if (r < 0) return { line: 0, col: 0 };
      return { line: r, col: c };
    }

    case 'E': {
      let r = line, c = col;
      const onWORD = !isWhitespace(buffer[r][c] || ' ');

      if (onWORD) {
        c++;
        while (r < buffer.length && c < buffer[r].length) {
          if (isWhitespace(buffer[r][c])) break;
          c++;
        }
        c--;
      }

      if (c >= buffer[r].length || isWhitespace(buffer[r][c] || ' ')) {
        c++;
        while (r < buffer.length) {
          while (c < buffer[r].length && isWhitespace(buffer[r][c])) {
            c++;
          }
          if (c < buffer[r].length) break;
          r++;
          c = 0;
        }

        if (r >= buffer.length) return cursor;

        while (c < buffer[r].length && !isWhitespace(buffer[r][c])) {
          c++;
        }
        c--;
      }

      return { line: r, col: Math.max(0, c) };
    }

    default:
      return cursor;
  }
};
