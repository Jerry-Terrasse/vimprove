import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, RotateCcw, Clock, Keyboard, Trophy } from 'lucide-react';
import type { ChallengeConfig } from '@/core/types';
import { useVimEngine } from '@/hooks/useVimEngine';
import { useChallenge } from '@/hooks/useChallenge';
import { tokenizeLine, getTokenClassName } from '@/core/syntaxHighlight';
import { useTranslationSafe } from '@/hooks/useI18n';

type VimChallengeProps = {
  config: ChallengeConfig;
  onComplete: (result: { next?: boolean; time: number }) => void;
  lessonSlug?: string;
  i18nBaseKey?: string;
  disableContentI18n?: boolean;
};

export const VimChallenge = ({
  config,
  onComplete,
  lessonSlug,
  i18nBaseKey,
  disableContentI18n
}: VimChallengeProps) => {
  const { state, dispatch } = useVimEngine({
    buffer: config.initialBuffer,
    cursor: config.initialCursor
  });

  const { goalsStatus, elapsed, isComplete, restart, startTimer, completedCount } = useChallenge(
    config,
    state,
    onComplete
  );
  const { t } = useTranslationSafe(['challenge', 'lessons']);

  const [isFocused, setIsFocused] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [config]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;
    e.preventDefault();

    if (isComplete) return;
    startTimer();

    dispatch({
      type: 'KEYDOWN',
      payload: { key: e.key, ctrlKey: e.ctrlKey }
    });
  };

  const handleRestart = () => {
    dispatch({
      type: 'RESET',
      payload: { buffer: config.initialBuffer, cursor: config.initialCursor }
    });
    restart();
    setTimeout(() => inputRef.current?.focus(), 10);
  };

  const renderBuffer = () => {
    const language = config.language || 'auto';

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
    <div className="bg-stone-900 rounded-xl overflow-hidden border border-stone-800 shadow-2xl flex flex-col h-[500px] md:h-[600px]">
      {/* Header / Status Bar */}
      <div className="bg-stone-950 border-b border-stone-800 p-3 flex items-center justify-between text-sm font-mono">
        <div className="flex items-center gap-4">
          <div
            className={`px-2 py-0.5 rounded text-xs font-bold ${
              state.mode === 'normal'
                ? 'bg-green-900 text-green-400'
                : 'bg-blue-900 text-blue-400'
            }`}
          >
            {t(`mode.${state.mode}`, state.mode.toUpperCase(), { ns: 'challenge' })}
          </div>
          <div className="text-stone-500 flex items-center gap-2">
            <Clock size={14} />
            <span>
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-stone-500">
              {t('goals.label', 'Goals:', { ns: 'challenge' })}
            </span>
            <span className="text-white font-bold">
              {completedCount} / {config.goalsRequired}
            </span>
          </div>
          <button
            onClick={handleRestart}
            className="hover:text-white text-stone-500 transition-colors"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div
        className="flex-1 relative bg-stone-900 overflow-y-auto cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          type="text"
          className="opacity-0 absolute top-0 left-0 h-full w-full cursor-none"
          autoFocus
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        {!isFocused && !isComplete && (
          <div className="absolute inset-0 z-10 bg-stone-900/80 backdrop-blur-[1px] flex items-center justify-center text-stone-400 gap-2">
            <Keyboard size={20} />
            {t('focus.resume', 'Click to resume focus', { ns: 'challenge' })}
          </div>
        )}

        {isComplete && (
          <div className="absolute inset-0 z-20 bg-stone-950/90 flex flex-col items-center justify-center animate-in fade-in duration-500">
            <div className="bg-stone-900 p-8 rounded-2xl border border-green-900/50 shadow-2xl text-center max-w-md">
              <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                {t('complete.title', 'Lesson Complete!', { ns: 'challenge' })}
              </h3>
              <p className="text-stone-400 mb-6">
                {t('complete.subtitle', 'You finished in {{time}} seconds.', {
                  ns: 'challenge',
                  time: elapsed
                })}
              </p>
              <button
                onClick={() => onComplete({ next: true, time: elapsed })}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold w-full transition-all"
              >
                {t('complete.next', 'Next Lesson', { ns: 'challenge' })}
              </button>
            </div>
          </div>
        )}

        <div className="vim-editor-root">{renderBuffer()}</div>
      </div>

      {/* Goals List */}
      <div className="bg-stone-950 p-4 border-t border-stone-800">
        <h4 className="text-xs uppercase tracking-widest text-stone-500 font-bold mb-3">
          {t('goals.title', 'Mission Objectives', { ns: 'challenge' })}
        </h4>
        <div className="space-y-2">
          {config.goals.map(g => (
            <div
              key={g.id}
              className={`flex items-center gap-2 text-sm transition-colors ${
                goalsStatus[g.id] ? 'text-green-400 opacity-50' : 'text-stone-300'
              }`}
              >
                <CheckCircle2
                  size={16}
                  className={goalsStatus[g.id] ? 'fill-green-900' : 'text-stone-700'}
                />
              <span className={goalsStatus[g.id] ? 'line-through' : ''}>
                {disableContentI18n
                  ? g.description
                  : t(
                      i18nBaseKey && lessonSlug
                        ? `${i18nBaseKey}.goals.${g.id}`
                        : `lessons.${lessonSlug ?? 'unknown'}.goals.${g.id}`,
                      g.description,
                      { ns: 'lessons' }
                    )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
