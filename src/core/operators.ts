import type { VimState, Cursor, Operator, Motion } from './types';
import { getMotionTarget } from './motions';

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

  const newBuffer = [...buffer];

  if (start.line === end.line) {
    const lineText = newBuffer[start.line];
    const newLine = lineText.slice(0, start.col) + lineText.slice(end.col);
    newBuffer[start.line] = newLine;

    return {
      ...state,
      buffer: newBuffer,
      cursor: start,
      pendingOperator: null,
      mode: operator === 'c' ? 'insert' : 'normal',
      lastCommand: { type: 'delete-range', operator, motion }
    };
  }

  return state;
};
