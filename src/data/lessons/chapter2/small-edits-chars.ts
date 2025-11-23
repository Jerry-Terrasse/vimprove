import type { Lesson } from '@/core/types';

export const smallEditsChars: Lesson = {
  slug: 'small-edits-chars',
  title: 'Small edits: x, s, r',
  categoryId: 'chapter2',
  shortDescription: 'Use x, s, and r to clean up tiny mistakes without full Insert mode.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Three quick-fix commands

When you only need to fix a single character, there's no need for a full Insert session.

In Normal mode:

- **x** – delete the character under the cursor (like Backspace, but for the current position).
- **r{char}** – **replace** the character under cursor with \`{char}\` and stay in Normal.
- **s** – **substitute**: delete the character under cursor **and** enter Insert mode (good when you need to type more than one character).

Think of them as precision tools:
- **x** for removing
- **r** for swapping one-for-one
- **s** for swapping one-for-many`
    },
    {
      type: 'markdown',
      content: `## When to use each command

**Use x** when you need to delete extra characters:
- \`foo;;;\` → place cursor on \`;\` and press **x** twice → \`foo;\`

**Use r** when you need to fix a single wrong character:
- \`vxlue\` → place cursor on \`x\` and press **ra** → \`value\`

**Use s** when the fix is longer than one character:
- \`fo\` → place cursor on \`o\` and press **s** then type \`alse\` → \`false\``
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          'let status = "actuve";',
          'let count = 100;'
        ],
        initialCursor: { line: 0, col: 14 },
        autoPlaySpeed: 900,
        tracks: [
          { label: 'Fix with r and x', keys: [] }
        ],
        steps: [
          { key: 'l', description: 'l: move to the wrong letter "u".', cursorIndex: 0 },
          { key: 'l', description: 'l: move to the wrong letter "u".', cursorIndex: 0 },
          { key: 'l', description: 'l: move to the wrong letter "u".', cursorIndex: 0 },
          { key: 'r', description: 'r: prepare to replace "u".', cursorIndex: 0 },
          { key: 'i', description: 'Type "i" to fix "actuve" → "active".', cursorIndex: 0 },
          { key: 'j', description: 'j: move down to line 2.', cursorIndex: 0 },
          { key: '$', description: '$: jump to the end of line.', cursorIndex: 0 },
          { key: 'x', description: 'x: delete the last "0".', cursorIndex: 0 },
          { key: 'x', description: 'x: delete another "0" to get count = 1.', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['x'], desc: 'Delete character under cursor' },
        { chars: ['r'], desc: 'Replace character under cursor with next typed character' },
        { chars: ['s'], desc: 'Delete character under cursor and enter Insert' },
        { chars: ['Esc'], desc: 'Back to Normal mode' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          'const obj = { x: 42, a: 5 };',
          'if (obj.x === 0, obj.a > 0) {',
          '  console.log("zrro");',
          '}'
        ],
        initialCursor: { line: 0, col: 0 },
        goalsRequired: 3,
        enabledCommands: ['h', 'j', 'k', 'l', '0', '$', 'w', 'b', 'e', 'x', 's', 'r', 'i', 'a', 'Escape'],
        goals: [
          {
            id: 'remove-one-equals',
            type: 'change',
            description: 'Use x to change "===" to "==" (remove one "=").',
            validator: (_prev, next) => {
              if (next.buffer.length < 2) return false;
              const line = next.buffer[1];
              return line.includes('obj.x == 0') && !line.includes('===');
            }
          },
          {
            id: 'fix-zero-typo',
            type: 'change',
            description: 'Use r to fix "zrro" → "zero" (replace one character).',
            validator: (_prev, next) => {
              if (next.buffer.length < 3) return false;
              const line = next.buffer[2];
              return line.includes('"zero"') && !line.includes('"zrro"');
            }
          },
          {
            id: 'comma-to-and',
            type: 'change',
            description: 'Use s to change "," to "&&" in the if condition (delete and type multiple chars).',
            validator: (_prev, next) => {
              if (next.buffer.length < 2) return false;
              const line = next.buffer[1];
              return line.includes('&&') && !line.includes(', obj.a');
            }
          }
        ]
      }
    }
  ]
};
