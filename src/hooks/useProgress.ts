import { useState, useEffect } from 'react';
import type { UserProgress } from '@/core/types';

const STORAGE_KEY = 'vimprove-progress';

const loadProgress = (): UserProgress => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveProgress = (progress: UserProgress) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
};

export const useProgress = () => {
  const [progress, setProgress] = useState<UserProgress>(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const updateLessonProgress = (
    lessonSlug: string,
    update: Partial<UserProgress[string]>
  ) => {
    setProgress(prev => ({
      ...prev,
      [lessonSlug]: {
        completedGoalsCount: 0,
        totalGoals: 0,
        bestTimeSeconds: null,
        attemptsCount: 0,
        lastCompletedAt: null,
        ...prev[lessonSlug],
        ...update
      }
    }));
  };

  return { progress, updateLessonProgress };
};
