import { spawnSync } from 'node:child_process';

export type NeovimState = {
  lines: string[];
  cursor: { line: number; col: number };
  mode: string;
};

export class NeovimNotAvailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NeovimNotAvailableError';
  }
}

const toLuaLongString = (content: string) => {
  // Choose a delimiter that cannot collide with the payload.
  for (let eq = 1; eq < 6; eq += 1) {
    const marker = '='.repeat(eq);
    const open = `[${marker}[`;
    const close = `]${marker}]`;
    if (!content.includes(close)) {
      return `${open}${content}${close}`;
    }
  }
  throw new Error('Unable to encode content for Lua command');
};

const buildLuaCommand = (lines: string[], cursor: { line: number; col: number }, keySeq: string) => {
  const jsonLines = JSON.stringify(lines);
  const luaLines = toLuaLongString(jsonLines);
  const luaKeys = toLuaLongString(keySeq);
  const colZeroBased = Math.max(cursor.col - 1, 0);
  return [
    `local initial = vim.fn.json_decode(${luaLines})`,
    'vim.api.nvim_buf_set_lines(0, 0, -1, false, initial)',
    `vim.api.nvim_win_set_cursor(0, {${cursor.line}, ${colZeroBased}})`,
    `local keys = vim.api.nvim_replace_termcodes(${luaKeys}, true, false, true)`,
    'vim.api.nvim_feedkeys(keys, "nx", false)',
    'vim.cmd("redraw")',
    'local lines = vim.api.nvim_buf_get_lines(0, 0, -1, false)',
    'local pos = vim.api.nvim_win_get_cursor(0)',
    'local mode = vim.api.nvim_get_mode().mode',
    'print(vim.fn.json_encode({ lines = lines, cursor = pos, mode = mode }))',
  ].join('; ');
};

export const runInNeovim = (
  lines: string[],
  cursor: { line: number; col: number },
  keySeq: string
): NeovimState => {
  try {
    const availability = spawnSync('nvim', ['--version'], { encoding: 'utf8' });
    if (availability.status === null) {
      throw new NeovimNotAvailableError('Neovim is not available in PATH');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Neovim is not available in PATH';
    throw new NeovimNotAvailableError(message);
  }

  const luaCmd = buildLuaCommand(lines, cursor, keySeq);
  let proc;
  try {
    proc = spawnSync('nvim', ['--headless', '--clean', '-n', `+lua ${luaCmd}`, '+qa!'], {
      encoding: 'utf8'
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to spawn Neovim';
    throw new NeovimNotAvailableError(message);
  }

  if (proc.status === null) {
    const message = proc.error ? proc.error.message : 'Failed to run Neovim';
    throw new NeovimNotAvailableError(message);
  }

  if (proc.status !== 0) {
    throw new Error(proc.stderr || 'Failed to run Neovim');
  }

  const rawOutput = proc.stdout?.trim() || proc.stderr?.trim() || '';
  if (!rawOutput) {
    throw new Error(proc.stderr || 'No output from Neovim');
  }

  let parsed: { lines: string[]; cursor: [number, number]; mode: string };
  try {
    parsed = JSON.parse(rawOutput);
  } catch (parseErr) {
    const braceIndex = rawOutput.lastIndexOf('{');
    if (braceIndex === -1) {
      throw new Error(proc.stderr || 'Failed to parse Neovim output');
    }
    const sliced = rawOutput.slice(braceIndex);
    parsed = JSON.parse(sliced);
  }
  return {
    lines: parsed.lines,
    cursor: { line: parsed.cursor[0], col: parsed.cursor[1] + 1 },
    mode: parsed.mode
  };
};
