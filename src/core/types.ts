export type Cursor = {
  line: number;
  col: number;
};

export type Mode = 'normal' | 'insert';

export type Operator = 'd' | 'c' | 'y';

export type Motion = 'h' | 'j' | 'k' | 'l' | 'w' | 'b' | '0' | '$';

export type Command = {
  type: 'move' | 'delete-char' | 'delete-line' | 'delete-range' | 'enter-insert' | 'open-line' | 'open-line-above' | 'mode-switch';
  motion?: Motion;
  operator?: Operator;
  to?: Mode;
};

export type VimState = {
  buffer: string[];
  cursor: Cursor;
  mode: Mode;
  pendingOperator: Operator | null;
  lastCommand: Command | null;
};

export type VimAction = {
  type: 'RESET' | 'KEYDOWN';
  payload?: any;
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

export type ContentBlock =
  | { type: 'markdown'; content: string }
  | { type: 'key-list'; keys: KeyItem[] }
  | { type: 'challenge'; config: ChallengeConfig };

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
