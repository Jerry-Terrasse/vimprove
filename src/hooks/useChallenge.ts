import { useState, useEffect } from 'react';
import type { VimState, ChallengeConfig } from '@/core/types';

export const useChallenge = (
  config: ChallengeConfig,
  state: VimState,
  onComplete?: (result: { time: number }) => void
) => {
  const [goalsStatus, setGoalsStatus] = useState<Record<string, boolean>>({});
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime && !isComplete) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, isComplete]);

  useEffect(() => {
    if (isComplete) return;

    const newStatus = { ...goalsStatus };
    let changed = false;

    config.goals.forEach(g => {
      if (!newStatus[g.id]) {
        if (g.validator(null, state, state.lastCommand)) {
          newStatus[g.id] = true;
          changed = true;
        }
      }
    });

    if (changed) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGoalsStatus(newStatus);
      if (!startTime) setStartTime(Date.now());

      const completedCount = Object.values(newStatus).filter(Boolean).length;
      if (completedCount >= config.goalsRequired) {
        setIsComplete(true);
        onComplete?.({ time: elapsed });
      }
    }
  }, [state, config, goalsStatus, startTime, isComplete, elapsed, onComplete]);

  const restart = () => {
    setGoalsStatus({});
    setStartTime(null);
    setElapsed(0);
    setIsComplete(false);
  };

  const startTimer = () => {
    if (!startTime) setStartTime(Date.now());
  };

  return {
    goalsStatus,
    elapsed,
    isComplete,
    restart,
    startTimer,
    completedCount: Object.values(goalsStatus).filter(Boolean).length
  };
};
