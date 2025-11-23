import { useRef, useCallback } from 'react';
import type { VimState } from '@/core/types';
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

  // Count prefix (if count exists and not part of operator)
  if (prevState.count && !prevState.pendingOperator) {
    return 'countPrefix';
  }

  return 'standalone';
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

  if (currentGroup.pendingKind === 'countPrefix') {
    // Can accept: more digits or motion
    if (prevState.count || /^[0-9]$/.test(key)) return false;
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

  // Check if command was executed (no more pending states)
  const wasPending = prevState.pendingOperator || prevState.pendingReplace ||
                     prevState.pendingFind || prevState.pendingTextObject ||
                     prevState.pendingSearch;
  const stillPending = nextState.pendingOperator || nextState.pendingReplace ||
                       nextState.pendingFind || nextState.pendingTextObject ||
                       nextState.pendingSearch;

  if (wasPending && !stillPending) {
    // Check if state actually changed (applied) or was ignored
    const bufferChanged = prevState.buffer.length !== nextState.buffer.length ||
                         prevState.buffer.some((line, i) => line !== nextState.buffer[i]);
    const cursorMoved = prevState.cursor.line !== nextState.cursor.line ||
                       prevState.cursor.col !== nextState.cursor.col;
    const modeChanged = prevState.mode !== nextState.mode;

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

export const useKeyHistory = () => {
  const historyRef = useRef<KeyHistory>([]);

  const recordKey = useCallback((
    key: string,
    ctrlKey: boolean,
    prevState: VimState,
    nextState: VimState
  ) => {
    const kind = getKeyKind(key, ctrlKey, prevState, nextState);
    const display = formatKeyDisplay(key, ctrlKey);

    const currentGroup = historyRef.current[historyRef.current.length - 1] || null;
    const startNew = shouldStartNewGroup(key, ctrlKey, prevState, nextState, currentGroup);

    if (startNew) {
      // Create new group
      const groupType = detectGroupType(key, prevState, nextState, kind);
      const groupStatus = determineGroupStatus(prevState, nextState, key, groupType);
      const pendingKind = getPendingKind(nextState);
      const role = getRoleInGroup(key, kind, groupType, prevState);

      const newAtom: KeyAtom = {
        id: globalKeyId++,
        rawKey: key,
        display,
        kind,
        status: groupStatus,
        roleInGroup: role,
      };

      const newGroup: KeyGroup = {
        id: globalGroupId++,
        keys: [newAtom],
        type: groupType,
        status: groupStatus,
        pendingKind,
      };

      historyRef.current = [...historyRef.current, newGroup];
    } else {
      // Add to existing group
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

      // Update all keys in group to match group status
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

      historyRef.current = [
        ...historyRef.current.slice(0, -1),
        updatedGroup
      ];
    }

    // If just entered Insert mode, create virtual "Ins" group
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

      historyRef.current = [...historyRef.current, insGroup];
    }
  }, []);

  const getHistory = useCallback((): KeyHistory => {
    return historyRef.current;
  }, []);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    globalKeyId = 0;
    globalGroupId = 0;
  }, []);

  return {
    recordKey,
    getHistory,
    clearHistory
  };
};
