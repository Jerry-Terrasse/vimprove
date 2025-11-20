import type { Lesson } from '@/core/types';
import { CATEGORIES } from './categories';

// Chapter 1: Modes & Basic Movement
import { modesBasics } from './lessons/chapter1/modes-basics';
import { motionsHjkl } from './lessons/chapter1/motions-hjkl';
import { motionsLineBounds } from './lessons/chapter1/motions-line-bounds';
import { modesMovementMiniReview } from './lessons/chapter1/modes-movement-mini-review';

// Chapter 2: Words & Small Edits
import { motionsWords } from './lessons/chapter2/motions-words';
import { wordsFixSmallThings } from './lessons/chapter2/words-fix-small-things';
import { motionsWORDs } from './lessons/chapter2/motions-WORDs';
import { smallEditsChars } from './lessons/chapter2/small-edits-chars';
import { wordsMiniReview } from './lessons/chapter2/words-mini-review';

// Chapter 3: Advanced Editing
import { comboOperators } from './lessons/chapter3/combo-operators';
import { yankPaste } from './lessons/chapter3/yank-paste';
import { undoRedo } from './lessons/chapter3/undo-redo';
import { countMultiplier } from './lessons/chapter3/count-multiplier';
import { repeatDot } from './lessons/chapter3/repeat-dot';

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
