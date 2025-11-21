export type TokenType =
  | 'keyword'
  | 'string'
  | 'comment'
  | 'number'
  | 'operator'
  | 'punctuation'
  | 'function'
  | 'type'
  | 'preprocessor'
  | 'plain';

export type Token = {
  type: TokenType;
  content: string;
};

export type Language = 'cpp' | 'javascript' | 'typescript' | 'python' | 'auto';

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

const CPP_KEYWORDS = new Set([
  'alignas', 'alignof', 'and', 'and_eq', 'asm', 'auto', 'bitand', 'bitor',
  'bool', 'break', 'case', 'catch', 'char', 'char8_t', 'char16_t', 'char32_t',
  'class', 'compl', 'concept', 'const', 'consteval', 'constexpr', 'constinit',
  'const_cast', 'continue', 'co_await', 'co_return', 'co_yield', 'decltype',
  'default', 'delete', 'do', 'double', 'dynamic_cast', 'else', 'enum', 'explicit',
  'export', 'extern', 'false', 'float', 'for', 'friend', 'goto', 'if', 'inline',
  'int', 'long', 'mutable', 'namespace', 'new', 'noexcept', 'not', 'not_eq',
  'nullptr', 'operator', 'or', 'or_eq', 'private', 'protected', 'public',
  'register', 'reinterpret_cast', 'requires', 'return', 'short', 'signed',
  'sizeof', 'static', 'static_assert', 'static_cast', 'struct', 'switch',
  'template', 'this', 'thread_local', 'throw', 'true', 'try', 'typedef',
  'typeid', 'typename', 'union', 'unsigned', 'using', 'virtual', 'void',
  'volatile', 'wchar_t', 'while', 'xor', 'xor_eq',
]);

const CPP_TYPES = new Set([
  'std', 'string', 'vector', 'map', 'set', 'unordered_map', 'unordered_set',
  'pair', 'tuple', 'array', 'deque', 'list', 'queue', 'stack', 'priority_queue',
  'size_t', 'int8_t', 'int16_t', 'int32_t', 'int64_t',
  'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t',
]);

const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
  'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
  'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
]);

const OPERATORS = new Set(['+', '-', '*', '/', '=', '>', '<', '!', '&', '|', '%', '^', '~']);
const PUNCTUATION = new Set(['(', ')', '{', '}', '[', ']', ';', ',', '.', ':', '?']);

function detectLanguage(buffer: string[]): Language {
  const text = buffer.join('\n');

  if (text.includes('#include') || text.includes('std::') || text.includes('cout') || text.includes('cin')) {
    return 'cpp';
  }
  if (text.includes('def ') || text.includes('import ') && text.includes(':')) {
    return 'python';
  }
  return 'javascript';
}

export function tokenizeLine(line: string, language: Language = 'auto', buffer?: string[]): Token[] {
  let lang = language;
  if (lang === 'auto' && buffer) {
    lang = detectLanguage(buffer);
  } else if (lang === 'auto') {
    lang = 'javascript';
  }

  const keywords = lang === 'cpp' ? CPP_KEYWORDS :
                   lang === 'python' ? PYTHON_KEYWORDS :
                   JS_KEYWORDS;

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

    // C++ preprocessor directives
    if (lang === 'cpp' && char === '#') {
      let j = i;
      while (j < line.length && /[a-zA-Z_]/.test(line[j + 1])) j++;
      tokens.push({ type: 'preprocessor', content: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Python comments
    if (lang === 'python' && char === '#') {
      tokens.push({ type: 'comment', content: line.slice(i) });
      break;
    }

    // C++/JS/TS comments
    if ((lang === 'cpp' || lang === 'javascript' || lang === 'typescript') &&
        char === '/' && i + 1 < line.length && line[i + 1] === '/') {
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

    // Template literals (JS/TS only)
    if ((lang === 'javascript' || lang === 'typescript') && char === '`') {
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

    // C++ scope resolution operator ::
    if (lang === 'cpp' && char === ':' && i + 1 < line.length && line[i + 1] === ':') {
      tokens.push({ type: 'operator', content: '::' });
      i += 2;
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

    // Identifiers (keywords, types, functions, or plain)
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

      if (keywords.has(word)) {
        tokens.push({ type: 'keyword', content: word });
      } else if (lang === 'cpp' && CPP_TYPES.has(word)) {
        tokens.push({ type: 'type', content: word });
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
    case 'type':
      return 'text-blue-400';
    case 'preprocessor':
      return 'text-pink-400';
    case 'plain':
    default:
      return 'text-stone-300';
  }
}
