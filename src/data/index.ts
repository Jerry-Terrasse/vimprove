import type { Lesson } from '@/core/types';
import { CATEGORIES } from './categories';
import { modesBasics } from './lessons/basics/modes-basics';
import { movingHjkl } from './lessons/basics/moving-hjkl';
import { motionsHjkl } from './lessons/basics/motions-hjkl';
import { motionsLineBounds } from './lessons/basics/motions-line-bounds';
import { modesMovementMiniReview } from './lessons/basics/modes-movement-mini-review';
import { motionsWords } from './lessons/basics/motions-words';
import { wordsFixSmallThings } from './lessons/basics/words-fix-small-things';
import { motionsWORDs } from './lessons/basics/motions-WORDs';
import { smallEditsChars } from './lessons/basics/small-edits-chars';
import { wordsMiniReview } from './lessons/basics/words-mini-review';
import { wordMotion } from './lessons/basics/word-motion';
import { deletion } from './lessons/edits/deletion';
import { insertMode } from './lessons/edits/insert-mode';

export { CATEGORIES };

export const LESSONS: Lesson[] = [
  modesBasics,
  movingHjkl,
  motionsHjkl,
  motionsLineBounds,
  modesMovementMiniReview,
  motionsWords,
  wordsFixSmallThings,
  motionsWORDs,
  smallEditsChars,
  wordsMiniReview,
  wordMotion,
  deletion,
  insertMode
];
