import type { Lesson } from '@/core/types';
import { CATEGORIES } from './categories';
import { modesBasics } from './lessons/basics/modes-basics';
import { movingHjkl } from './lessons/basics/moving-hjkl';
import { wordMotion } from './lessons/basics/word-motion';
import { deletion } from './lessons/edits/deletion';
import { insertMode } from './lessons/edits/insert-mode';

export { CATEGORIES };

export const LESSONS: Lesson[] = [
  modesBasics,
  movingHjkl,
  wordMotion,
  deletion,
  insertMode
];
