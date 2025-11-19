import type { Lesson } from '@/core/types';
import { CATEGORIES } from './categories';
import { movingHjkl } from './lessons/basics/moving-hjkl';
import { wordMotion } from './lessons/basics/word-motion';
import { deletion } from './lessons/edits/deletion';
import { insertMode } from './lessons/edits/insert-mode';

export { CATEGORIES };

export const LESSONS: Lesson[] = [
  movingHjkl,
  wordMotion,
  deletion,
  insertMode
];
