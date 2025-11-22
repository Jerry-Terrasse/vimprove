import { INITIAL_VIM_STATE, vimReducer } from '@/core/vimReducer';
import type { VimState } from '@/core/types';

type ParsedKey = { key: string; ctrlKey?: boolean };

const KEY_TOKEN_MAP: Record<string, ParsedKey> = {
  '<Esc>': { key: 'Escape' },
  '<Enter>': { key: 'Enter' },
  '<CR>': { key: 'Enter' },
  '<BS>': { key: 'Backspace' },
  '<Tab>': { key: 'Tab' },
  '<Space>': { key: ' ' },
  '<C-r>': { key: 'r', ctrlKey: true },
  '<C-R>': { key: 'r', ctrlKey: true },
};

const parseKeySequence = (keySeq: string): ParsedKey[] => {
  const keys: ParsedKey[] = [];
  for (let i = 0; i < keySeq.length; i++) {
    const char = keySeq[i];
    if (char === '<') {
      const end = keySeq.indexOf('>', i);
      if (end !== -1) {
        const token = keySeq.slice(i, end + 1);
        keys.push(KEY_TOKEN_MAP[token] ?? { key: token.slice(1, -1) });
        i = end;
        continue;
      }
    }
    keys.push({ key: char });
  }
  return keys;
};

export const runSimKeys = (initialState: Partial<VimState>, keySeq: string): VimState => {
  let state: VimState = { ...INITIAL_VIM_STATE, ...initialState };

  const parsedKeys = parseKeySequence(keySeq);
  for (const parsed of parsedKeys) {
    state = vimReducer(state, {
      type: 'KEYDOWN',
      payload: { key: parsed.key, ctrlKey: parsed.ctrlKey ?? false }
    });
  }

  return state;
};
