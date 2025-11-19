export type TokenType =
  | 'keyword'
  | 'string'
  | 'comment'
  | 'number'
  | 'operator'
  | 'punctuation'
  | 'function'
  | 'plain';

export type Token = {
  type: TokenType;
  content: string;
};

const JS_KEYWORDS = new Set([
  'const',
  'let',
  'var',
  'function',
  'return',
  'if',
  'else',
  'for',
  'while',
  'do',
  'switch',
  'case',
  'break',
  'continue',
  'class',
  'extends',
  'import',
  'export',
  'from',
  'default',
  'async',
  'await',
  'try',
  'catch',
  'finally',
  'throw',
  'new',
  'this',
  'super',
  'typeof',
  'instanceof',
  'void',
  'delete',
  'in',
  'of',
]);

const OPERATORS = new Set(['+', '-', '*', '/', '=', '>', '<', '!', '&', '|', '%', '^', '~']);
const PUNCTUATION = new Set(['(', ')', '{', '}', '[', ']', ';', ',', '.', ':', '?']);

export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    // Skip whitespace
    if (char === ' ' || char === '\t') {
      tokens.push({ type: 'plain', content: char });
      i++;
      continue;
    }

    // Comments
    if (char === '/' && i + 1 < line.length && line[i + 1] === '/') {
      tokens.push({ type: 'comment', content: line.slice(i) });
      break;
    }

    // String literals (single quote)
    if (char === "'") {
      let j = i + 1;
      while (j < line.length && line[j] !== "'") {
        if (line[j] === '\\') j++;
        j++;
      }
      tokens.push({ type: 'string', content: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // String literals (double quote)
    if (char === '"') {
      let j = i + 1;
      while (j < line.length && line[j] !== '"') {
        if (line[j] === '\\') j++;
        j++;
      }
      tokens.push({ type: 'string', content: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Template literals
    if (char === '`') {
      let j = i + 1;
      while (j < line.length && line[j] !== '`') {
        if (line[j] === '\\') j++;
        j++;
      }
      tokens.push({ type: 'string', content: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Numbers
    if (/\d/.test(char)) {
      let j = i;
      while (j < line.length && /[\d.]/.test(line[j])) {
        j++;
      }
      tokens.push({ type: 'number', content: line.slice(i, j) });
      i = j;
      continue;
    }

    // Operators
    if (OPERATORS.has(char)) {
      let j = i;
      while (j < line.length && OPERATORS.has(line[j])) {
        j++;
      }
      tokens.push({ type: 'operator', content: line.slice(i, j) });
      i = j;
      continue;
    }

    // Punctuation
    if (PUNCTUATION.has(char)) {
      tokens.push({ type: 'punctuation', content: char });
      i++;
      continue;
    }

    // Identifiers (keywords or plain)
    if (/[a-zA-Z_$]/.test(char)) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) {
        j++;
      }
      const word = line.slice(i, j);

      // Check if function call (followed by '(')
      let k = j;
      while (k < line.length && (line[k] === ' ' || line[k] === '\t')) k++;
      const isFunction = k < line.length && line[k] === '(';

      if (JS_KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', content: word });
      } else if (isFunction) {
        tokens.push({ type: 'function', content: word });
      } else {
        tokens.push({ type: 'plain', content: word });
      }
      i = j;
      continue;
    }

    // Fallback
    tokens.push({ type: 'plain', content: char });
    i++;
  }

  return tokens;
}

export function getTokenClassName(type: TokenType): string {
  switch (type) {
    case 'keyword':
      return 'text-purple-400';
    case 'string':
      return 'text-green-400';
    case 'comment':
      return 'text-stone-500 italic';
    case 'number':
      return 'text-orange-400';
    case 'operator':
      return 'text-cyan-400';
    case 'punctuation':
      return 'text-stone-400';
    case 'function':
      return 'text-yellow-400';
    case 'plain':
    default:
      return 'text-stone-300';
  }
}
