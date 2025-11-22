import { useState } from 'react';
import { useVimEngine } from '@/hooks/useVimEngine';
import { tokenizeLine, getTokenClassName } from '@/core/syntaxHighlight';
import { useTranslationSafe } from '@/hooks/useI18n';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { getFontFamily } from '@/hooks/useFontLoader';

type Language = 'cpp' | 'js' | 'py' | 'auto';

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'cpp', label: 'C++' },
  { value: 'js', label: 'JavaScript' },
  { value: 'py', label: 'Python' },
  { value: 'auto', label: 'Auto' }
];

const DEFAULT_CODE_SAMPLES = {
  cpp: [
    '[[nodiscard]] constexpr auto fast_inv_sqrt(float x) noexcept -> float {',
    '    using std::uint32_t;',
    '',
    '    constexpr auto magic        = 0x5f3759dfu;',
    '    constexpr auto half         = 0.5f;',
    '    constexpr auto three_halfs  = 1.5f;',
    '',
    '    if (x <= 0.0f || !std::isfinite(x)) {',
    '        return std::numeric_limits<float>::quiet_NaN();',
    '    }',
    '',
    '    auto i = std::bit_cast<uint32_t>(x);        // float -> bits',
    '    i = magic - (i >> 1);                       // magic initial guess',
    '    auto y = std::bit_cast<float>(i);           // bits -> float',
    '',
    '    y = y * (three_halfs - half * x * y * y);   // Newton-Raphson step',
    '',
    '    return y;',
    '}'
  ],
  js: [
    'function quickSort(arr) {',
    '  if (arr.length <= 1) return arr;',
    '',
    '  const pivot = arr[Math.floor(arr.length / 2)];',
    '  const left = arr.filter(x => x < pivot);',
    '  const middle = arr.filter(x => x === pivot);',
    '  const right = arr.filter(x => x > pivot);',
    '',
    '  return [...quickSort(left), ...middle, ...quickSort(right)];',
    '}',
    '',
    'console.log(quickSort([3, 1, 4, 1, 5, 9, 2, 6]));'
  ],
  py: [
    'def fibonacci(n: int) -> int:',
    '    """Calculate Fibonacci number using memoization."""',
    '    memo = {}',
    '    ',
    '    def fib(x: int) -> int:',
    '        if x in memo:',
    '            return memo[x]',
    '        if x <= 1:',
    '            return x',
    '        memo[x] = fib(x - 1) + fib(x - 2)',
    '        return memo[x]',
    '    ',
    '    return fib(n)',
    '',
    'print(fibonacci(10))'
  ]
};

const DEFAULT_CODE = {
  ...DEFAULT_CODE_SAMPLES,
  auto: DEFAULT_CODE_SAMPLES.cpp
};

export const VimPlaygroundTab = () => {
  const { t } = useTranslationSafe('settings');
  const { settings } = useSettingsContext();
  const [language, setLanguage] = useState<Language>('cpp');

  const { state, dispatch } = useVimEngine({
    buffer: DEFAULT_CODE[language],
    cursor: { line: 0, col: 0 }
  });

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    dispatch({
      type: 'RESET',
      payload: { buffer: DEFAULT_CODE[newLang], cursor: { line: 0, col: 0 } }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;
    e.preventDefault();

    dispatch({
      type: 'KEYDOWN',
      payload: { key: e.key, ctrlKey: e.ctrlKey }
    });
  };

  const renderBuffer = () => {
    return state.buffer.map((line, r) => {
      const tokens = tokenizeLine(line, language, state.buffer);
      let charIndex = 0;

      return (
        <div key={r} className="vim-editor-line">
          <span className="vim-line-number">{r + 1}</span>
          <div className="vim-line-content">
            {tokens.map((token, tokenIdx) => {
              const tokenChars = token.content.split('');
              const tokenColor = getTokenClassName(token.type);

              return tokenChars.map((char, localIdx) => {
                const c = charIndex++;
                const isCursor = state.cursor.line === r && state.cursor.col === c;
                const isNormalMode = state.mode === 'normal';
                const cursorTextClass = isCursor
                  ? isNormalMode
                    ? 'relative z-10 text-stone-900 font-bold'
                    : 'relative z-10'
                  : '';

                return (
                  <span
                    key={`${tokenIdx}-${localIdx}`}
                    className={`${tokenColor} ${isCursor ? 'relative' : ''}`}
                  >
                    {isCursor && (
                      <span
                        className={`absolute ${
                          isNormalMode
                            ? 'inset-0 bg-stone-200 opacity-70'
                            : 'left-0 top-0 bottom-0 w-0.5 bg-stone-200 opacity-90'
                        }`}
                      />
                    )}
                    <span className={cursorTextClass}>{char}</span>
                  </span>
                );
              });
            })}
            {state.cursor.line === r && state.cursor.col === line.length && (
              <span
                className={`${
                  state.mode === 'normal'
                    ? 'bg-stone-200 opacity-70 inline-block w-2.5 h-5'
                    : 'bg-stone-200 opacity-90 inline-block w-0.5 h-5'
                }`}
              >
                &nbsp;
              </span>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Language Selector */}
      <div>
        <label className="block text-sm font-semibold text-stone-200 mb-3">
          {t('playground.language', 'Language')}
        </label>
        <div className="flex gap-2">
          {LANGUAGE_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => handleLanguageChange(option.value)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                language === option.value
                  ? 'bg-green-600 text-white'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Indicator */}
      <div className="flex items-center gap-3">
        <div
          className={`px-3 py-1 rounded text-xs font-bold ${
            state.mode === 'normal'
              ? 'bg-green-900 text-green-400'
              : 'bg-blue-900 text-blue-400'
          }`}
        >
          {state.mode.toUpperCase()}
        </div>
        <span className="text-sm text-stone-400">
          {t('playground.hint', 'Try Vim commands in this playground')}
        </span>
      </div>

      {/* Vim Editor */}
      <div
        className="bg-stone-900 rounded-lg border border-stone-700 overflow-hidden cursor-text"
        onClick={(e) => {
          const input = (e.currentTarget.querySelector('input') as HTMLInputElement);
          input?.focus();
        }}
      >
        <input
          type="text"
          className="opacity-0 absolute top-0 left-0 h-0 w-0"
          autoFocus
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <div
          className="vim-editor-root p-4"
          style={{
            fontFamily: getFontFamily(settings.editor.fontFamily),
            fontSize: `${settings.editor.fontSize}px`
          }}
        >
          {renderBuffer()}
        </div>
      </div>

      {/* Tip */}
      <div className="text-xs text-stone-500 bg-stone-800/50 rounded-lg p-3">
        💡 {t('playground.tip', 'This is a fully functional Vim editor. Try commands like h/j/k/l, w/b/e, d/c/y, i/a/o, and more!')}
      </div>
    </div>
  );
};
