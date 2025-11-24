import { useRef } from 'react';
import type { VimState, KeyPress } from '@/core/types';
import type {
  KeyHistory,
  KeyGroup,
  KeyAtom,
  KeyKind,
  KeyStatus,
  KeyGroupType,
  PendingKind,
  KeyGroupStatus
} from '@/core/keyHistory.types';

let globalKeyId = 0;
let globalGroupId = 0;

const formatKeyDisplay = (key: string, ctrlKey: boolean): string => {
  if (ctrlKey) return `Ctrl-${key}`;
  if (key === 'Escape') return 'Esc';
  if (key === 'Enter') return '⏎';
  if (key === 'Backspace') return '⌫';
  if (key === ' ') return 'Space';
  return key;
};

const formatLastChange = (lastChange: KeyPress[] | null): string | undefined => {
  if (!lastChange || lastChange.length === 0) return undefined;

  const keys = lastChange.map(kp => formatKeyDisplay(kp.key, kp.ctrlKey)).join('');
  return `→ ${keys}`;
};

const getKeyKind = (
  key: string,
  ctrlKey: boolean,
  prevState: VimState,
  nextState: VimState
): KeyKind => {
  if (ctrlKey) return 'control';
  if (key === 'Escape') return 'escape';
  if (key === 'Enter') return 'enter';

  // In Insert mode, most keys are just text input
  if (prevState.mode === 'insert') {
    if (key === 'Backspace') return 'other';
    if (key.length === 1) return 'other'; // Regular character input
    return 'other';
  }

  // Count prefix (only in Normal mode)
  if (/^[1-9]$/.test(key) && !prevState.pendingOperator && !prevState.pendingReplace) {
    return 'count';
  }

  // Operator
  if (['d', 'c', 'y'].includes(key) && nextState.pendingOperator && prevState.mode === 'normal') {
    return 'operator';
  }

  // Replace
  if (key === 'r' && nextState.pendingReplace) {
    return 'replace';
  }

  // Text object prefix (when following operator)
  if (['i', 'a'].includes(key) && prevState.pendingOperator && nextState.pendingTextObject) {
    return 'textObjectPrefix';
  }

  // Insert mode commands
  if (['i', 'I', 'a', 'A', 'o', 'O'].includes(key) && nextState.mode === 'insert') {
    return 'insert';
  }

  // Search control
  if (['/', '?', 'n', 'N', '*', '#'].includes(key)) {
    return 'searchControl';
  }

  // Find char trigger
  if (['f', 'F', 't', 'T'].includes(key) && nextState.pendingFind) {
    return 'searchControl';
  }

  // Character after find
  if (prevState.pendingFind && key.length === 1) {
    return 'findChar';
  }

  // Search input characters
  if (prevState.pendingSearch && key.length === 1) {
    return 'searchChar';
  }

  // Motion commands (only in Normal mode)
  if (['h', 'j', 'k', 'l', 'w', 'b', 'e', 'W', 'B', 'E', '0', '$', '^', '_', ';', ','].includes(key)) {
    return 'motion';
  }

  return 'other';
};

const detectGroupType = (
  key: string,
  prevState: VimState,
  nextState: VimState,
  kind: KeyKind
): KeyGroupType => {
  // Insert text (only when already in insert mode, not when entering)
  if (prevState.mode === 'insert') {
    return 'insertText';
  }

  // Operator motion
  if (kind === 'operator' || prevState.pendingOperator) {
    return 'operatorMotion';
  }

  // Replace char
  if (kind === 'replace' || prevState.pendingReplace) {
    return 'replaceChar';
  }

  // Find char
  if ((kind === 'searchControl' && ['f', 'F', 't', 'T'].includes(key)) || prevState.pendingFind) {
    return 'findChar';
  }

  // Search
  if (kind === 'searchControl' && ['/', '?'].includes(key)) {
    return 'search';
  }

  // Count prefix (only when key is digit or already building count)
  if (/^[1-9]$/.test(key) || (prevState.count && /^[0-9]$/.test(key))) {
    return 'countPrefix';
  }

  return 'standalone';
};

const searchStateChanged = (prevState: VimState, nextState: VimState): boolean => {
  const prev = prevState.lastSearch;
  const next = nextState.lastSearch;
  if (!prev && !next) return false;
  if (!prev || !next) return true;
  return prev.pattern !== next.pattern || prev.direction !== next.direction;
};

const findStateChanged = (prevState: VimState, nextState: VimState): boolean => {
  const prev = prevState.lastFind;
  const next = nextState.lastFind;
  if (!prev && !next) return false;
  if (!prev || !next) return true;
  return prev.type !== next.type || prev.char !== next.char;
};

const shouldStartNewGroup = (
  key: string,
  ctrlKey: boolean,
  prevState: VimState,
  nextState: VimState,
  currentGroup: KeyGroup | null
): boolean => {
  // No current group -> always start new
  if (!currentGroup) return true;

  // Insert mode: continue adding to insertText group (even if not pending)
  if (currentGroup.type === 'insertText') {
    // Keep adding keys to the group while in insert mode
    if (prevState.mode === 'insert') return false;
    // Escape exits insert mode, add it to the group
    if (key === 'Escape') return false;
    // Otherwise (mode switched without Escape), start new group
    return true;
  }

  // Current group is completed/cancelled/ignored -> start new
  if (currentGroup.status !== 'pending') return true;

  // Escape pressed -> finish current group
  if (key === 'Escape') return false;

  // Check if key belongs to current pending group
  if (currentGroup.pendingKind === 'operatorMotion') {
    // Can accept: count, text object prefix, motion, escape
    if (prevState.pendingOperator || nextState.pendingOperator || nextState.pendingTextObject) {
      return false;
    }
  }

  if (currentGroup.pendingKind === 'replaceChar') {
    // Can accept: single char or escape
    if (prevState.pendingReplace) return false;
  }

  if (currentGroup.pendingKind === 'findChar') {
    // Can accept: single char or escape
    if (prevState.pendingFind) return false;
  }

  if (currentGroup.pendingKind === 'searchInput') {
    // Can accept: any char, backspace, enter, escape
    if (prevState.pendingSearch) return false;
  }

  if (currentGroup.pendingKind === 'countPrefix' || currentGroup.type === 'countPrefix') {
    // Can accept: more digits or any command that uses the count
    // If count is still present in prevState, the motion hasn't been executed yet
    if (prevState.count) return false;
    // If key is a digit, keep adding to count
    if (/^[0-9]$/.test(key)) return false;
  }

  return true;
};

const determineGroupStatus = (
  prevState: VimState,
  nextState: VimState,
  key: string,
  groupType: KeyGroupType
): KeyGroupStatus => {
  // insertText: stay pending until Escape is pressed
  if (groupType === 'insertText') {
    if (key === 'Escape') {
      return 'applied';
    }
    // Still in insert mode -> pending
    return 'pending';
  }

  // Escape pressed -> cancelled (except for search, which is normal exit)
  if (key === 'Escape') {
    if (groupType === 'search') {
      return 'applied';
    }
    return 'cancelled';
  }

  // countPrefix: stay pending while count exists, applied when count is consumed
  if (groupType === 'countPrefix') {
    if (nextState.count) {
      return 'pending';
    }
    // Count was consumed - check if command executed
    const bufferChanged = prevState.buffer.length !== nextState.buffer.length ||
                         prevState.buffer.some((line, i) => line !== nextState.buffer[i]);
    const cursorMoved = prevState.cursor.line !== nextState.cursor.line ||
                       prevState.cursor.col !== nextState.cursor.col;
    const modeChanged = prevState.mode !== nextState.mode;
    if (bufferChanged || cursorMoved || modeChanged) {
      return 'applied';
    }
    return 'ignored';
  }

  // Check if command was executed (no more pending states)
  const wasPending = prevState.pendingOperator || prevState.pendingReplace ||
                     prevState.pendingFind || prevState.pendingTextObject ||
                     prevState.pendingSearch;
  const stillPending = nextState.pendingOperator || nextState.pendingReplace ||
                       nextState.pendingFind || nextState.pendingTextObject ||
                       nextState.pendingSearch;

  if (wasPending && !stillPending) {
    const bufferChanged = prevState.buffer.length !== nextState.buffer.length ||
                         prevState.buffer.some((line, i) => line !== nextState.buffer[i]);
    const cursorMoved = prevState.cursor.line !== nextState.cursor.line ||
                       prevState.cursor.col !== nextState.cursor.col;
    const modeChanged = prevState.mode !== nextState.mode;

    // Find char: pendingFind 被清空且 lastFind 未更新 -> 视为取消
    if (prevState.pendingFind && !findStateChanged(prevState, nextState) && !bufferChanged && !cursorMoved && !modeChanged) {
      return 'cancelled';
    }

    // Yank updates寄存器但不改 buffer/cursor，仍视为有效
    if (nextState.lastCommand?.type === 'yank') {
      return 'applied';
    }

    // 搜索/查找状态更新也视为有效（即便未移动光标）
    if (searchStateChanged(prevState, nextState) || findStateChanged(prevState, nextState)) {
      return 'applied';
    }

    // Check if state actually changed (applied) or was ignored
    if (bufferChanged || cursorMoved || modeChanged) {
      return 'applied';
    } else {
      return 'ignored';
    }
  }

  // Still has pending state -> pending
  if (stillPending) {
    return 'pending';
  }

  // No pending state and not escape -> check if standalone command worked
  if (searchStateChanged(prevState, nextState) || findStateChanged(prevState, nextState)) {
    return 'applied';
  }

  const bufferChanged = prevState.buffer.length !== nextState.buffer.length ||
                       prevState.buffer.some((line, i) => line !== nextState.buffer[i]);
  const cursorMoved = prevState.cursor.line !== nextState.cursor.line ||
                     prevState.cursor.col !== nextState.cursor.col;
  const modeChanged = prevState.mode !== nextState.mode;

  if (bufferChanged || cursorMoved || modeChanged) {
    return 'applied';
  }

  return 'ignored';
};

const getPendingKind = (state: VimState): PendingKind | undefined => {
  if (state.pendingOperator || state.pendingTextObject) return 'operatorMotion';
  if (state.pendingReplace) return 'replaceChar';
  if (state.pendingFind) return 'findChar';
  if (state.pendingSearch) return 'searchInput';
  if (state.count) return 'countPrefix';
  return undefined;
};

const getRoleInGroup = (
  key: string,
  kind: KeyKind,
  groupType: KeyGroupType,
  prevState: VimState
): string => {
  if (key === '.') return 'dotRepeat';
  if (kind === 'operator') return 'operator';
  if (kind === 'motion') return 'motion';
  if (kind === 'count') return 'count';
  if (kind === 'textObjectPrefix') return 'textObjectPrefix';
  if (kind === 'replace') return 'replaceOperator';
  if (kind === 'findChar') return 'targetChar';
  if (kind === 'searchChar') return 'searchChar';
  if (kind === 'searchControl') {
    if (['f', 'F', 't', 'T'].includes(key)) return 'findOperator';
    if (['/', '?'].includes(key)) return 'searchOperator';
    return 'searchControl';
  }
  if (kind === 'escape') return 'cancel';
  if (kind === 'enter') return 'confirm';
  return 'other';
};

type KeyHistoryStore = {
  recordKey: (
    key: string,
    ctrlKey: boolean,
    prevState: VimState,
    nextState: VimState
  ) => void;
  getHistory: () => KeyHistory;
  clearHistory: () => void;
};

const createKeyHistoryStore = (): KeyHistoryStore => {
  let history: KeyHistory = [];

  const recordKey = (
    key: string,
    ctrlKey: boolean,
    prevState: VimState,
    nextState: VimState
  ) => {
    const kind = getKeyKind(key, ctrlKey, prevState, nextState);
    const display = formatKeyDisplay(key, ctrlKey);

    const currentGroup = history[history.length - 1] || null;
    const startNew = shouldStartNewGroup(key, ctrlKey, prevState, nextState, currentGroup);

    if (startNew) {
      const groupType = detectGroupType(key, prevState, nextState, kind);
      const groupStatus = determineGroupStatus(prevState, nextState, key, groupType);
      const pendingKind = getPendingKind(nextState);
      const role = getRoleInGroup(key, kind, groupType, prevState);
      const description = key === '.' ? formatLastChange(prevState.lastChange) : undefined;

      const newAtom: KeyAtom = {
        id: globalKeyId++,
        rawKey: key,
        display,
        kind,
        status: groupStatus,
        roleInGroup: role,
        description,
      };

      const summary = key === '.' && prevState.lastChange
        ? formatLastChange(prevState.lastChange)
        : undefined;

      const newGroup: KeyGroup = {
        id: globalGroupId++,
        keys: [newAtom],
        type: groupType,
        status: groupStatus,
        pendingKind,
        summary,
      };

      history = [...history, newGroup];
    } else {
      if (!currentGroup) return;

      const groupType = currentGroup.type;
      const role = getRoleInGroup(key, kind, groupType, prevState);

      const newAtom: KeyAtom = {
        id: globalKeyId++,
        rawKey: key,
        display,
        kind,
        status: 'pending',
        roleInGroup: role,
      };

      const groupStatus = determineGroupStatus(prevState, nextState, key, groupType);
      const pendingKind = getPendingKind(nextState);

      const updatedKeys = [...currentGroup.keys, newAtom].map(k => ({
        ...k,
        status: groupStatus
      }));

      const updatedGroup: KeyGroup = {
        ...currentGroup,
        keys: updatedKeys,
        status: groupStatus,
        pendingKind,
      };

      history = [...history.slice(0, -1), updatedGroup];
    }

    if (prevState.mode === 'normal' && nextState.mode === 'insert') {
      const insAtom: KeyAtom = {
        id: globalKeyId++,
        rawKey: 'Ins',
        display: 'Ins',
        kind: 'insert',
        status: 'pending',
        roleInGroup: 'insertTrigger',
      };

      const insGroup: KeyGroup = {
        id: globalGroupId++,
        keys: [insAtom],
        type: 'insertText',
        status: 'pending',
        pendingKind: undefined,
      };

      history = [...history, insGroup];
    }
  };

  const getHistory = (): KeyHistory => history;

  const clearHistory = () => {
    history = [];
    globalKeyId = 0;
    globalGroupId = 0;
  };

  return { recordKey, getHistory, clearHistory };
};

export const useKeyHistory = (): KeyHistoryStore => {
  const storeRef = useRef<KeyHistoryStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = createKeyHistoryStore();
  }
  return storeRef.current;
};
export const createKeyHistoryManager = () => createKeyHistoryStore();
