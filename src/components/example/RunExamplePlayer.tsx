import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, SkipForward, SkipBack } from 'lucide-react';
import type { RunExampleConfig, VimState } from '@/core/types';
import { vimReducer, INITIAL_VIM_STATE } from '@/core/vimReducer';
import { tokenizeLine, getTokenClassName } from '@/core/syntaxHighlight';
import { useTranslationSafe } from '@/hooks/useI18n';
import { useKeyHistory } from '@/hooks/useKeyHistory';
import { KeyHistoryPanel } from '@/components/common/KeyHistoryPanel';

type RunExamplePlayerProps = {
  config: RunExampleConfig;
  lessonSlug?: string;
  i18nBaseKey?: string;
  disableI18n?: boolean;
};

export const RunExamplePlayer = ({
  config,
  lessonSlug,
  i18nBaseKey,
  disableI18n
}: RunExamplePlayerProps) => {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [states, setStates] = useState<VimState[]>([]);
  const autoPlayInterval = useRef<NodeJS.Timeout | null>(null);
  const { t } = useTranslationSafe(['example', 'lessons']);
  const { recordKey, getHistory, clearHistory } = useKeyHistory();

  useEffect(() => {
    const initialStates = config.tracks.map(() => ({
      ...INITIAL_VIM_STATE,
      buffer: config.initialBuffer,
      cursor: config.initialCursor
    }));
    setStates(initialStates);
    setCurrentStep(-1);
    clearHistory();
  }, [config, clearHistory]);

  const executeStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex < 0 || stepIndex >= config.steps.length) return;

      const step = config.steps[stepIndex];
      const cursorIdx = step.cursorIndex ?? 0;

      setStates(prevStates => {
        const newStates = [...prevStates];
        const prevState = newStates[cursorIdx];
        const nextState = vimReducer(prevState, {
          type: 'KEYDOWN',
          payload: { key: step.key, ctrlKey: false }
        });
        newStates[cursorIdx] = nextState;

        recordKey(step.key, false, prevState, nextState);

        return newStates;
      });

      setCurrentStep(stepIndex);
    },
    [config.steps, recordKey]
  );

  const executeStepImmediately = useCallback(
    (stepIndex: number) => {
      if (stepIndex < 0 || stepIndex >= config.steps.length) return;

      const step = config.steps[stepIndex];
      const cursorIdx = step.cursorIndex ?? 0;

      setStates(prev => {
        const newStates = [...prev];
        const prevState = newStates[cursorIdx];
        const nextState = vimReducer(prevState, {
          type: 'KEYDOWN',
          payload: { key: step.key, ctrlKey: false }
        });
        newStates[cursorIdx] = nextState;

        recordKey(step.key, false, prevState, nextState);

        return newStates;
      });
      setCurrentStep(stepIndex);
    },
    [config.steps, recordKey]
  );

  const handleNext = useCallback(() => {
    if (currentStep < config.steps.length - 1) {
      executeStep(currentStep + 1);
    }
  }, [currentStep, config.steps.length, executeStep]);

  useEffect(() => {
    if (isPlaying && currentStep < config.steps.length - 1) {
      autoPlayInterval.current = setTimeout(() => {
        handleNext();
      }, config.autoPlaySpeed || 1000);
    } else if (currentStep >= config.steps.length - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (autoPlayInterval.current) {
        clearTimeout(autoPlayInterval.current);
      }
    };
  }, [isPlaying, currentStep, config.steps.length, config.autoPlaySpeed, handleNext]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    const initialStates = config.tracks.map(() => ({
      ...INITIAL_VIM_STATE,
      buffer: config.initialBuffer,
      cursor: config.initialCursor
    }));
    setStates(initialStates);
    setCurrentStep(-1);
    clearHistory();
  }, [config, clearHistory]);

  const handlePlay = useCallback(() => {
    if (currentStep >= config.steps.length - 1) {
      handleReset();
      setTimeout(() => setIsPlaying(true), 100);
    } else {
      setIsPlaying(true);
    }
  }, [currentStep, config.steps.length, handleReset]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      handleReset();
      for (let i = 0; i < currentStep; i++) {
        executeStepImmediately(i);
      }
    } else if (currentStep === 0) {
      handleReset();
    }
  }, [currentStep, executeStepImmediately, handleReset]);

  const renderBuffer = () => {
    const displayState = states[0];
    if (!displayState) return null;

    const language = config.language || 'auto';

    return displayState.buffer.map((line, r) => {
      const tokens = tokenizeLine(line, language, displayState.buffer);
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
                const cursorsAtPos = states
                  .map((s, idx) => ({ state: s, idx }))
                  .filter(({ state }) => state.cursor.line === r && state.cursor.col === c);

                const renderChar = cursorsAtPos.length > 0 ? (
                  <span
                    key={`${tokenIdx}-${localIdx}`}
                    className={`${tokenColor} relative`}
                  >
                    {cursorsAtPos.map(({ idx }) => {
                      const track = config.tracks[idx];
                      if (!track) return null;
                      const bgColor = track.color || (idx === 0 ? 'bg-blue-500' : 'bg-green-500');
                      const isNormalMode = states[idx].mode === 'normal';

                      return (
                        <span
                          key={idx}
                          className={`absolute ${bgColor} ${
                            isNormalMode
                              ? 'inset-0 opacity-70'
                              : 'left-0 top-0 bottom-0 w-0.5 opacity-90'
                          }`}
                        />
                      );
                    })}
                    <span className="relative z-10 text-stone-900 font-bold">{char}</span>
                  </span>
                ) : (
                  <span key={`${tokenIdx}-${localIdx}`} className={tokenColor}>
                    {char}
                  </span>
                );

                return renderChar;
              });
            })}
            {states.some(s => s.cursor.line === r && s.cursor.col === line.length) && (
              <span className="inline-block">
                {states
                  .map((s, idx) => ({ state: s, idx }))
                  .filter(({ state }) => state.cursor.line === r && state.cursor.col === line.length)
                  .map(({ idx }) => {
                    const track = config.tracks[idx];
                    const bgColor = track.color || (idx === 0 ? 'bg-blue-500' : 'bg-green-500');
                    const isNormalMode = states[idx].mode === 'normal';

                    return (
                      <span
                        key={idx}
                        className={`${bgColor} inline-block h-5 ${
                          isNormalMode
                            ? 'w-2.5 opacity-70'
                            : 'w-0.5 opacity-90'
                        }`}
                      >
                        &nbsp;
                      </span>
                    );
                  })}
              </span>
            )}
          </div>
        </div>
      );
    });
  };

  const currentStepData = currentStep >= 0 ? config.steps[currentStep] : null;
  const resolveStepDesc = (index: number, fallback: string) => {
    if (disableI18n || !lessonSlug) return fallback;
    const key = i18nBaseKey
      ? `${i18nBaseKey}.steps.${index}`
      : `lessons.${lessonSlug}.runExample.steps.${index}`;
    return t(key, fallback, { ns: 'lessons' });
  };
  const keyedLabel = (key: string, fallback: string) => t(key, fallback, { ns: 'example' });

  return (
    <div className="bg-stone-900 rounded-xl overflow-hidden border border-stone-800 shadow-2xl flex flex-row gap-0 h-[500px]">
      {/* Left: Player */}
      <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="bg-stone-950 border-b border-stone-800 p-3 flex items-center justify-between text-sm font-mono">
        <div className="text-stone-400">{keyedLabel('title', 'Run Example')}</div>
        <div className="flex items-center gap-2">
          {config.tracks.map((track, idx) => {
            const bgColor = track.color || (idx === 0 ? 'bg-blue-500' : 'bg-green-500');
            return (
              <div key={idx} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${bgColor}`} />
                <span className="text-xs text-stone-400">
                  {disableI18n || !lessonSlug
                    ? track.label
                    : t(
                        i18nBaseKey
                          ? `${i18nBaseKey}.tracks.${idx}`
                          : `lessons.${lessonSlug}.runExample.tracks.${idx}`,
                        track.label,
                        { ns: 'lessons' }
                      )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Area */}
      <div className="bg-stone-900 min-h-[300px]">
        <div className="vim-editor-root">{renderBuffer()}</div>
      </div>

      {/* Current Step Display */}
      {currentStepData && (
        <div className="bg-stone-950 border-t border-stone-800 p-4">
          <div className="flex items-center gap-4">
            <div className="bg-stone-800 px-3 py-1 rounded font-mono text-lg font-bold text-white">
              {currentStepData.key === ' '
                ? keyedLabel('space', 'Space')
                : currentStepData.key}
            </div>
            <div className="text-stone-400 text-sm flex-1">
              {resolveStepDesc(currentStep, currentStepData.description)}
            </div>
            <div className="text-xs text-stone-600">
              {keyedLabel('step', 'Step')} {currentStep + 1} / {config.steps.length}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-stone-950 border-t border-stone-800 p-4 flex items-center justify-center gap-3">
        <button
          onClick={handleReset}
          className="p-2 hover:bg-stone-800 rounded transition-colors text-stone-400 hover:text-white"
          title={keyedLabel('reset', 'Reset')}
        >
          <RotateCcw size={18} />
        </button>
        <button
          onClick={handlePrev}
          disabled={currentStep <= 0}
          className="p-2 hover:bg-stone-800 rounded transition-colors text-stone-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title={keyedLabel('prev', 'Previous Step')}
        >
          <SkipBack size={18} />
        </button>
        {isPlaying ? (
          <button
            onClick={handlePause}
            className="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors text-white"
            title={keyedLabel('pause', 'Pause')}
          >
            <Pause size={20} />
          </button>
        ) : (
          <button
            onClick={handlePlay}
            className="p-3 bg-green-600 hover:bg-green-500 rounded-lg transition-colors text-white"
            title={keyedLabel('play', 'Play')}
          >
            <Play size={20} />
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={currentStep >= config.steps.length - 1}
          className="p-2 hover:bg-stone-800 rounded transition-colors text-stone-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          title={keyedLabel('next', 'Next Step')}
        >
          <SkipForward size={18} />
        </button>
      </div>
      </div>

      {/* Right: Key History Panel */}
      <div className="w-64 border-l border-stone-800 bg-stone-950/50 flex-shrink-0">
        <KeyHistoryPanel history={getHistory()} />
      </div>
    </div>
  );
};
