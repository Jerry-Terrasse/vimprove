import { describe, it, expect } from 'vitest';
import { runSimKeys } from '@/core/testUtils/runSim';
import { runInNeovim, NeovimNotAvailableError } from '@/core/testUtils/runInNeovim';
import { DEFAULT_INIT, getShardCases } from './exhaustiveTestCases';

const SHARD_INDEX = 6;
const SHARD_COUNT = 8;
const CASES = getShardCases(SHARD_INDEX, SHARD_COUNT);

describe(`Vim emulator matches Neovim (exhaustive parity shard ${SHARD_INDEX})`, () => {
  it.each(CASES)('$label', async testCase => {
    let realState;
    try {
      realState = runInNeovim(testCase.lines, testCase.cursor, testCase.keySeq);
    } catch (err) {
      if (err instanceof NeovimNotAvailableError) {
        console.warn('Neovim not available, skipping generated parity tests.');
        return;
      }
      throw err;
    }

    const simState = runSimKeys(
      {
        ...DEFAULT_INIT,
        buffer: testCase.lines,
        cursor: { line: testCase.cursor.line - 1, col: testCase.cursor.col - 1 }
      },
      testCase.keySeq
    );

    expect(simState.buffer).toEqual(realState.lines);
    expect({ line: simState.cursor.line + 1, col: simState.cursor.col + 1 }).toEqual(realState.cursor);
    expect(simState.mode.charAt(0)).toBe(realState.mode.charAt(0));
  });
});
