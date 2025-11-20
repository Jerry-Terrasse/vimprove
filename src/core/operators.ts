import type { VimState, Operator, Motion } from './types';
import { getMotionTarget } from './motions';
import { isWhitespace } from './utils';

// Helper: create snapshot for history
const createSnapshot = (state: VimState): VimState => {
  return {
    buffer: [...state.buffer],
    cursor: { ...state.cursor },
    mode: state.mode,
    pendingOperator: state.pendingOperator,
    pendingReplace: state.pendingReplace,
    pendingFind: state.pendingFind,
    lastCommand: state.lastCommand,
    history: [],
    historyIndex: -1,
    register: state.register,
    count: state.count,
    lastFind: state.lastFind,
    lastChange: state.lastChange ? [...state.lastChange] : null,
    changeRecording: state.changeRecording ? [...state.changeRecording] : null,
    lastChangeCount: state.lastChangeCount,
    recordingCount: state.recordingCount,
    lastChangeCursor: state.lastChangeCursor ? { ...state.lastChangeCursor } : null,
    lastChangeInsertCursor: state.lastChangeInsertCursor ? { ...state.lastChangeInsertCursor } : null,
    recordingExitCursor: state.recordingExitCursor ? { ...state.recordingExitCursor } : null,
    recordingInsertCursor: state.recordingInsertCursor ? { ...state.recordingInsertCursor } : null,
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
  const target = getMotionTarget(state, motion, true);

  let start = cursor;
  let end = target;

   // If we're changing a word from a whitespace position, keep the range empty
  const startChar = buffer[start.line]?.[start.col] ?? '';
  if (operator === 'c' && motion === 'w' && isWhitespace(startChar)) {
    end = start;
  }

  if (start.line > end.line || (start.line === end.line && start.col > end.col)) {
    [start, end] = [end, start];
  }

  if (start.line === end.line) {
    const lineText = buffer[start.line];

    // Determine if motion is inclusive (should include the target character)
    // In Vim: $ and e/E are inclusive for operator ranges
    const inclusiveMotions: Motion[] = ['$', 'e', 'E'];
    const isInclusive = inclusiveMotions.includes(motion);

    // For inclusive motions, include the target character
    const endCol = isInclusive ? Math.min(end.col + 1, lineText.length) : end.col;
    const yankedText = lineText.slice(start.col, endCol);
    const registerText = operator === 'y' && motion === 'w' && endCol === lineText.length
      ? `${yankedText} `
      : yankedText;

    if (operator === 'y') {
      // Yank: copy to register, don't modify buffer
      return {
        ...state,
        register: registerText,
        pendingOperator: null,
        lastCommand: { type: 'yank' }
      };
    }

    // Delete or Change: modify buffer
    const stateWithHistory = pushHistory(state);
    const newBuffer = [...buffer];
    const newLine = lineText.slice(0, start.col) + lineText.slice(endCol);
    newBuffer[start.line] = newLine;

    return {
      ...stateWithHistory,
      buffer: newBuffer,
      cursor: start,
      pendingOperator: null,
      mode: operator === 'c' ? 'insert' : 'normal',
      register: registerText,
      lastCommand: { type: 'delete-range', operator, motion }
    };
  }

  return state;
};
