export type Cursor = {
  line: number;
  col: number;
};

export type Mode = 'normal' | 'insert';

export type Operator = 'd' | 'c' | 'y';

export type Motion = 'h' | 'j' | 'k' | 'l' | 'w' | 'b' | 'e' | '0' | '$' | '^' | '_' | 'W' | 'B' | 'E';

export type Command = {
  type: 'move' | 'delete-char' | 'delete-line' | 'delete-range' | 'enter-insert' | 'open-line' | 'open-line-above' | 'mode-switch' | 'yank' | 'paste';
  motion?: Motion;
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
  lastCommand: Command | null;

  // Undo/Redo support
  history: VimState[];
  historyIndex: number;

  // Yank/Paste support
  register: string;

  // Count prefix (e.g., "3" in "3dw")
  count: string;

  // Last find motion (for ; and ,)
  lastFind: FindMotion | null;

  // Last change action (for . repeat)
  lastChange: VimAction | null;
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
};

export type ContentBlock =
  | { type: 'markdown'; content: string }
  | { type: 'key-list'; keys: KeyItem[] }
  | { type: 'challenge'; config: ChallengeConfig }
  | { type: 'run-example'; config: RunExampleConfig };

export type KeyItem = {
  chars: string[];
  desc: string;
};

export type Lesson = {
  slug: string;
  title: string;
  categoryId: string;
  shortDescription: string;
  contentBlocks: ContentBlock[];
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
