export type KeyStatus = 'pending' | 'applied' | 'ignored' | 'cancelled';

export type KeyKind =
  | 'motion'          // h j k l w b e ...
  | 'operator'        // d c y
  | 'textObjectPrefix'// i / a (when used with operator)
  | 'count'           // 0-9 prefix
  | 'insert'          // i a o O (mode switch)
  | 'replace'         // r
  | 'findChar'        // character after f/F/t/T
  | 'searchControl'   // / ? n N * #
  | 'searchChar'      // characters in search input
  | 'enter'           // <CR>
  | 'escape'          // <Esc>
  | 'control'         // Ctrl-r etc
  | 'other';

export type PendingKind =
  | 'operatorMotion'  // d/c/y + motion/text object
  | 'replaceChar'     // r + {char}
  | 'findChar'        // f/F/t/T + {char}
  | 'searchInput'     // /...?<CR>
  | 'countPrefix';    // 3 5 ... + command

export type KeyAtom = {
  id: number;
  rawKey: string;
  display: string;
  kind: KeyKind;
  status: KeyStatus;
  roleInGroup?: string;
  description?: string;
};

export type KeyGroupStatus = 'pending' | 'applied' | 'ignored' | 'cancelled';

export type KeyGroupType =
  | 'standalone'      // single key command
  | 'operatorMotion'  // dw, diw, 3dw
  | 'replaceChar'     // r{char}
  | 'findChar'        // f{char}
  | 'search'          // /word<CR>
  | 'countPrefix';    // 3w, 10j

export type KeyGroup = {
  id: number;
  keys: KeyAtom[];
  type: KeyGroupType;
  status: KeyGroupStatus;
  pendingKind?: PendingKind;
  summary?: string;
  i18nKey?: string;
};

export type KeyHistory = KeyGroup[];
