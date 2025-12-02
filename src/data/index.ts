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
import { motionsWORDs } from './lessons/chapter2/motions-words-big';
import { smallEditsChars } from './lessons/chapter2/small-edits-chars';
import { wordsMiniReview } from './lessons/chapter2/words-mini-review';

// Chapter 3: Advanced Editing
import { operatorDeleteBasic } from './lessons/chapter3/operator-delete-basic';
import { operatorChangeBasic } from './lessons/chapter3/operator-change-basic';
import { operatorYankBasic } from './lessons/chapter3/operator-yank-basic';
import { countRepeatUndo } from './lessons/chapter3/count-repeat-undo';
import { operatorsMiniReview } from './lessons/chapter3/operators-mini-review';

// Chapter 4: In-line Find/Till & Precise Edits
import { findChar } from './lessons/chapter4/find-char';
import { deleteWithFind } from './lessons/chapter4/delete-with-find';
import { changeWithFind } from './lessons/chapter4/change-with-find';
import { inLinePrecisionReview } from './lessons/chapter4/in-line-precision-review';

// Chapter 5: Text Objects
import { textobjectsWords } from './lessons/chapter5/textobjects-words';
import { textobjectsParagraphs } from './lessons/chapter5/textobjects-paragraphs';
import { textobjectsBrackets } from './lessons/chapter5/textobjects-brackets';
import { textobjectsQuotes } from './lessons/chapter5/textobjects-quotes';
import { textobjectsMegaReview } from './lessons/chapter5/textobjects-mega-review';

// Chapter 6: Search & Refactor
import { searchBasic } from './lessons/chapter6/search-basic';
import { searchWithOperators } from './lessons/chapter6/search-with-operators';
import { realworldCleanup1 } from './lessons/chapter6/realworld-cleanup-1';
import { speedrunChallenge } from './lessons/chapter6/speedrun-challenge';

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
  operatorDeleteBasic,
  operatorChangeBasic,
  operatorYankBasic,
  countRepeatUndo,
  operatorsMiniReview,

  // Chapter 4: In-line Find/Till & Precise Edits
  findChar,
  deleteWithFind,
  changeWithFind,
  inLinePrecisionReview,

  // Chapter 5: Text Objects
  textobjectsWords,
  textobjectsParagraphs,
  textobjectsBrackets,
  textobjectsQuotes,
  textobjectsMegaReview,

  // Chapter 6: Search & Refactor
  searchBasic,
  searchWithOperators,
  realworldCleanup1,
  speedrunChallenge
];
