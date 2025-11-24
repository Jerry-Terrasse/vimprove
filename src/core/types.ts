export type Cursor = {
  line: number;
  col: number;
};

export type Mode = 'normal' | 'insert';

export type Operator = 'd' | 'c' | 'y';

export type Motion = 'h' | 'j' | 'k' | 'l' | 'w' | 'b' | 'e' | '0' | '$' | '^' | '_' | 'W' | 'B' | 'E';

export type TextObject =
  | 'iw' | 'aw'
  | 'ip' | 'ap'
  | 'i(' | 'a(' | 'i)' | 'a)' | 'i{' | 'a{' | 'i}' | 'a}' | 'i[' | 'a[' | 'i]' | 'a]'
  | 'i"' | 'a"' | "i'" | "a'" | 'i`' | 'a`';

export type OperatorMotion = Motion | TextObject;

export type SearchState = {
  pattern: string;
  direction: 'forward' | 'backward';
};

export type Command = {
  type: 'move' | 'delete-char' | 'delete-line' | 'delete-range' | 'enter-insert' | 'open-line' | 'open-line-above' | 'mode-switch' | 'yank' | 'paste';
  motion?: OperatorMotion;
  operator?: Operator;
  to?: Mode;
};

export type FindMotion = {
  type: 'f' | 'F' | 't' | 'T';
  char: string;
};

export type VimState = {
  buffer: string[];
  cursor: Cursor;
  mode: Mode;
  pendingOperator: Operator | null;
  pendingReplace: boolean;
  pendingFind: 'f' | 'F' | 't' | 'T' | null;
  pendingTextObject: 'i' | 'a' | null;
  pendingSearch: SearchState | null;
  lastSearch: SearchState | null;
  lastCommand: Command | null;

  // Undo/Redo support
  history: VimState[];
  historyIndex: number;

  // Yank/Paste support
  register: string;

  // Insert position (for Insert mode only, 0..len)
  // This is the actual insertion point, while cursor.col is the display position
  insertCol?: number;
  insertStart: Cursor | null;

  // Count prefix (e.g., "3" in "3dw")
  count: string;

  // Last find motion (for ; and ,)
  lastFind: FindMotion | null;

  // Last change action (for . repeat)
  lastChange: KeyPress[] | null;

  // Count used for last change (for . repeat)
  lastChangeCount: number | null;
  lastChangeCursor: Cursor | null;
  lastChangeInsertCursor: Cursor | null;
  lastChangeInsertStart: Cursor | null;

  // Currently recording change for . command
  changeRecording: KeyPress[] | null;

  // Count captured when recording a change
  recordingCount: number | null;
  recordingExitCursor: Cursor | null;
  recordingInsertCursor: Cursor | null;
};

export type VimAction = {
  type: 'RESET' | 'KEYDOWN';
  payload?: {
    key?: string;
    ctrlKey?: boolean;
    buffer?: string[];
    cursor?: Cursor;
    [key: string]: unknown;
  };
};

export type KeyPress = {
  key: string;
  ctrlKey: boolean;
};

export type ChallengeGoalType = 'move' | 'delete' | 'change' | 'insert' | 'custom';

export type ChallengeGoal = {
  id: string;
  type: ChallengeGoalType;
  description: string;
  validator: (prev: VimState | null, next: VimState, lastCommand?: Command | null) => boolean;
};

export type ChallengeConfig = {
  initialBuffer: string[];
  initialCursor: Cursor;
  goalsRequired: number;
  enabledCommands: string[];
  goals: ChallengeGoal[];
  language?: 'cpp' | 'javascript' | 'typescript' | 'python' | 'auto';
};

export type RunExampleStep = {
  key: string;
  description: string;
  cursorIndex?: number;
};

export type RunExampleTrack = {
  label: string;
  keys: string[];
  color?: string;
};

export type RunExampleConfig = {
  initialBuffer: string[];
  initialCursor: Cursor;
  tracks: RunExampleTrack[];
  steps: RunExampleStep[];
  autoPlaySpeed?: number;
  language?: 'cpp' | 'javascript' | 'typescript' | 'python' | 'auto';
};

export type ContentBlock =
  | { type: 'markdown'; content: string; i18nKey?: string }
  | { type: 'key-list'; keys: KeyItem[]; i18nKey?: string }
  | { type: 'challenge'; config: ChallengeConfig; i18nKey?: string }
  | { type: 'run-example'; config: RunExampleConfig; i18nKey?: string };

export type KeyItem = {
  chars: string[];
  desc: string;
  i18nKey?: string;
};

export type Lesson = {
  slug: string;
  title: string;
  categoryId: string;
  shortDescription: string;
  contentBlocks: ContentBlock[];
  i18nKey?: string;
};

export type Category = {
  id: string;
  title: string;
  order: number;
};

export type UserProgress = {
  [lessonSlug: string]: {
    completedGoalsCount: number;
    totalGoals: number;
    bestTimeSeconds: number | null;
    attemptsCount: number;
    lastCompletedAt: string | null;
  };
};
