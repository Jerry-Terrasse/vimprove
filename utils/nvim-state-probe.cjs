#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');

const USAGE = `
Usage:
  node utils/nvim-state-probe.cjs --lines '["foo bar"]' --cursor 1,1 --keys "p"
  node utils/nvim-state-probe.cjs --file path/to/buffer.txt --cursor 2,5 --keys "dw"

Options:
  --lines   JSON array of lines (use single quotes in shell)
  --file    Path to text file (overrides --lines if both provided)
  --cursor  1-based "line,col" (default 1,1)
  --keys    Key sequence (default empty)
  --debug   Print the generated Lua chunk
`;

const parseArgs = () => {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(USAGE.trim());
    process.exit(0);
  }

  const opts = { lines: [''], cursor: { line: 1, col: 1 }, keys: '', debug: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--lines' && args[i + 1]) {
      opts.lines = JSON.parse(args[++i]);
    } else if (arg === '--file' && args[i + 1]) {
      opts.lines = readFileSync(args[++i], 'utf8').replace(/\r\n/g, '\n').split('\n');
    } else if (arg === '--cursor' && args[i + 1]) {
      const [line, col] = args[++i].split(',').map(n => parseInt(n, 10));
      opts.cursor = { line: line || 1, col: col || 1 };
    } else if (arg === '--keys' && args[i + 1]) {
      opts.keys = args[++i];
    } else if (arg === '--debug') {
      opts.debug = true;
    }
  }
  return opts;
};

const toLuaLongString = content => {
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

const tokenizeKeySeq = keySeq => {
  const tokens = [];
  for (let i = 0; i < keySeq.length; i++) {
    const ch = keySeq[i];
    if (ch === '<') {
      const end = keySeq.indexOf('>', i);
      if (end !== -1) {
        tokens.push(keySeq.slice(i, end + 1));
        i = end;
        continue;
      }
    }
    tokens.push(ch);
  }
  return tokens;
};

const buildLuaCommand = (lines, cursor, keySeq) => {
  const jsonLines = JSON.stringify(lines);
  const luaLines = toLuaLongString(jsonLines);
  const luaTokens = toLuaLongString(JSON.stringify(tokenizeKeySeq(keySeq)));
  const colZeroBased = Math.max(cursor.col - 1, 0);
  return [
    'local orig_undolevels = vim.api.nvim_buf_get_option(0, "undolevels")',
    `local initial = vim.fn.json_decode(${luaLines})`,
    'vim.api.nvim_buf_set_lines(0, 0, -1, false, initial)',
    'vim.api.nvim_buf_set_option(0, "undolevels", -1)',
    'vim.api.nvim_buf_set_option(0, "undolevels", orig_undolevels)',
    `vim.api.nvim_win_set_cursor(0, {${cursor.line}, ${colZeroBased}})`,
    `local tokens = vim.fn.json_decode(${luaTokens})`,
    'local all_keys = ""',
    'for _,tok in ipairs(tokens) do',
    '  all_keys = all_keys .. vim.api.nvim_replace_termcodes(tok, true, false, true)',
    'end',
    'local ok, err = pcall(function()',
    '  vim.fn.feedkeys(all_keys, "xt")',
    'end)',
    'if not ok then',
    '  vim.api.nvim_err_writeln(err)',
    'end',
    'local lines = vim.api.nvim_buf_get_lines(0, 0, -1, false)',
    'local pos = vim.api.nvim_win_get_cursor(0)',
    'local mode = vim.api.nvim_get_mode().mode',
    'print("STATE_JSON:" .. vim.fn.json_encode({ lines = lines, cursor = pos, mode = mode }))',
  ].join('\n');
};

const runProbe = ({ lines, cursor, keys, debug }) => {
  const luaCmd = buildLuaCommand(lines, cursor, keys);
  if (debug) {
    console.log('--- lua ---');
    console.log(luaCmd);
  }
  const proc = spawnSync('nvim', ['--headless', '--clean', '-n', `+lua ${luaCmd}`, '+qa!'], {
    encoding: 'utf8'
  });
  const stdout = (proc.stdout || '').trim();
  const stderr = (proc.stderr || '').trim();
  return { status: proc.status, stdout, stderr };
};

const parseState = rawOutput => {
  const marker = 'STATE_JSON:';
  const idx = rawOutput.lastIndexOf(marker);
  if (idx === -1) return null;
  const payload = rawOutput.slice(idx + marker.length).trim();
  try {
    return JSON.parse(payload);
  } catch (err) {
    return null;
  }
};

const main = () => {
  const opts = parseArgs();
  const result = runProbe(opts);
  console.log('--- stdout ---');
  console.log(result.stdout || '<empty>');
  console.log('--- stderr ---');
  console.log(result.stderr || '<empty>');
  const parsed = parseState(result.stdout || result.stderr);
  console.log('--- parsed ---');
  if (parsed) {
    console.log(JSON.stringify(parsed, null, 2));
  } else {
    console.log('Unable to parse state payload');
  }
  process.exit(result.status === null ? 1 : result.status);
};

main();
