import type { VimState, Cursor, Operator, Motion } from './types';
import { getMotionTarget } from './motions';

// Helper: create snapshot for history
const createSnapshot = (state: VimState): VimState => {
  return {
    buffer: [...state.buffer],
    cursor: { ...state.cursor },
    mode: state.mode,
    pendingOperator: state.pendingOperator,
    pendingReplace: state.pendingReplace,
    lastCommand: state.lastCommand,
    history: [],
    historyIndex: -1,
    register: state.register,
    count: state.count,
    lastFind: state.lastFind,
    lastChange: state.lastChange,
  };
};

// Helper: add current state to history
const pushHistory = (state: VimState): VimState => {
  const snapshot = createSnapshot(state);
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(snapshot);

  const maxHistory = 100;
  if (newHistory.length > maxHistory) {
    newHistory.shift();
  }

  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
};

export const applyOperatorWithMotion = (
  state: VimState,
  operator: Operator,
  motion: Motion
): VimState => {
  const { buffer, cursor } = state;
  const target = getMotionTarget(state, motion);

  let start = cursor;
  let end = target;

  if (start.line > end.line || (start.line === end.line && start.col > end.col)) {
    [start, end] = [end, start];
  }

  if (start.line === end.line) {
    const lineText = buffer[start.line];
    const yankedText = lineText.slice(start.col, end.col);

    if (operator === 'y') {
      // Yank: copy to register, don't modify buffer
      return {
        ...state,
        register: yankedText,
        pendingOperator: null,
        lastCommand: { type: 'custom' as any }
      };
    }

    // Delete or Change: modify buffer
    const stateWithHistory = pushHistory(state);
    const newBuffer = [...buffer];
    const newLine = lineText.slice(0, start.col) + lineText.slice(end.col);
    newBuffer[start.line] = newLine;

    return {
      ...stateWithHistory,
      buffer: newBuffer,
      cursor: start,
      pendingOperator: null,
      mode: operator === 'c' ? 'insert' : 'normal',
      register: yankedText,
      lastCommand: { type: 'delete-range', operator, motion }
    };
  }

  return state;
};
