import type { Lesson } from '@/core/types';
import { CATEGORIES } from './categories';
import { modesBasics } from './lessons/basics/modes-basics';
import { motionsHjkl } from './lessons/basics/motions-hjkl';
import { motionsLineBounds } from './lessons/basics/motions-line-bounds';
import { modesMovementMiniReview } from './lessons/basics/modes-movement-mini-review';
import { motionsWords } from './lessons/basics/motions-words';
import { wordsFixSmallThings } from './lessons/basics/words-fix-small-things';
import { motionsWORDs } from './lessons/basics/motions-WORDs';
import { smallEditsChars } from './lessons/basics/small-edits-chars';
import { wordsMiniReview } from './lessons/basics/words-mini-review';

// Chapter 3: Advanced Editing
import { comboOperators } from './lessons/edits/combo-operators';
import { yankPaste } from './lessons/edits/yank-paste';
import { undoRedo } from './lessons/edits/undo-redo';
import { countMultiplier } from './lessons/edits/count-multiplier';
import { repeatDot } from './lessons/edits/repeat-dot';

export { CATEGORIES };

export const LESSONS: Lesson[] = [
  // Chapter 1 & 2: Basics
  modesBasics,
  motionsHjkl,
  motionsLineBounds,
  modesMovementMiniReview,
  motionsWords,
  wordsFixSmallThings,
  motionsWORDs,
  smallEditsChars,
  wordsMiniReview,

  // Chapter 3: Advanced Editing
  comboOperators,
  yankPaste,
  undoRedo,
  countMultiplier,
  repeatDot
];
