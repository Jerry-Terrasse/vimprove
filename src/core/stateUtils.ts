import type { KeyPress, VimState } from './types';

// Count helper used by motions and recordings
const MAX_HISTORY = 100;

export const getCount = (state: VimState): number => {
  const count = parseInt(state.count) || 1;
  return Math.max(1, Math.min(count, 999));
};

export const createSnapshot = (state: VimState): VimState => ({
  buffer: [...state.buffer],
  cursor: { ...state.cursor },
  mode: state.mode,
  pendingOperator: state.pendingOperator,
  pendingReplace: state.pendingReplace,
  pendingFind: state.pendingFind,
  pendingTextObject: state.pendingTextObject,
  pendingSearch: state.pendingSearch,
  lastSearch: state.lastSearch,
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
});

const appendSnapshot = (state: VimState, snapshot: VimState): { history: VimState[]; historyIndex: number } => {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(snapshot);

  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift();
  }

  return { history: newHistory, historyIndex: newHistory.length - 1 };
};

export const pushHistory = (state: VimState): VimState => {
  const snapshot = createSnapshot(state);
  const { history, historyIndex } = appendSnapshot(state, snapshot);
  return { ...state, history, historyIndex };
};

export const clearPendingStates = (state: VimState): VimState => ({
  ...state,
  pendingOperator: null,
  pendingReplace: false,
  pendingFind: null,
  pendingTextObject: null,
  pendingSearch: null,
  count: '',
  changeRecording: null,
  recordingCount: null,
  recordingExitCursor: null,
  recordingInsertCursor: null,
});

export const startRecording = (state: VimState, key: string, ctrlKey: boolean): VimState => {
  const recording: KeyPress[] = [{ key, ctrlKey }];
  return {
    ...state,
    changeRecording: recording,
    recordingCount: getCount(state),
    recordingExitCursor: null,
    recordingInsertCursor: null,
  };
};

export const recordKey = (state: VimState, key: string, ctrlKey: boolean): VimState => {
  if (!state.changeRecording) return state;
  return {
    ...state,
    changeRecording: [...state.changeRecording, { key, ctrlKey }],
  };
};

export const finishRecording = (state: VimState): VimState => {
  if (!state.changeRecording) return state;
  const exitCursor = state.recordingExitCursor ?? state.cursor;
  const insertCursor = state.recordingInsertCursor ?? state.cursor;
  const finalizedState = {
    ...state,
    lastChange: state.changeRecording,
    lastChangeCount: state.recordingCount ?? 1,
    changeRecording: null,
    recordingCount: null,
    lastChangeCursor: exitCursor,
    lastChangeInsertCursor: insertCursor,
    recordingExitCursor: null,
    recordingInsertCursor: null,
  };

  const snapshot = createSnapshot(finalizedState);
  const { history, historyIndex } = appendSnapshot(finalizedState, snapshot);

  return { ...finalizedState, history, historyIndex };
};
