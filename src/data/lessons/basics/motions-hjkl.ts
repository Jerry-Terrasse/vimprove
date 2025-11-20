import type { Lesson } from '@/core/types';

export const motionsHjkl: Lesson = {
  slug: 'motions-hjkl',
  title: 'Move with HJKL',
  categoryId: 'chapter1',
  shortDescription: 'Use HJKL instead of arrow keys to move the cursor.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Why HJKL?

In Vim, your hands stay on the home row.
Instead of reaching for the arrow keys, you move with:

- **h** → left
- **j** → down
- **k** → up
- **l** → right

Think of the cursor as a tiny player on a grid.
Your goal is to **walk** to the target using only these four keys.`
    },
    {
      type: 'markdown',
      content: `## Example: walking to the target

Imagine this tiny map:

\`\`\`
S.........
.....X....
...TARGET.
\`\`\`

- You start on \`S\` (top-left).
- First walk to the \`X\`.
- Then walk down and right to the start of \`TARGET\`.

You do all of this with **h j k l** only.`
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['h'], desc: 'Move left' },
        { chars: ['j'], desc: 'Move down' },
        { chars: ['k'], desc: 'Move up' },
        { chars: ['l'], desc: 'Move right' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          'S.........',
          '.....X....',
          '...TARGET.'
        ],
        initialCursor: { line: 0, col: 0 },
        goalsRequired: 2,
        enabledCommands: ['h', 'j', 'k', 'l'],
        goals: [
          {
            id: 'reach-X',
            type: 'move',
            description: 'Move the cursor onto the X on the second line.',
            validator: (prev, next) => {
              return next.cursor.line === 1 && next.cursor.col === 5;
            }
          },
          {
            id: 'reach-TARGET',
            type: 'move',
            description: 'Move the cursor to the T in "TARGET" on the last line.',
            validator: (prev, next) => {
              return next.cursor.line === 2 && next.cursor.col === 3;
            }
          }
        ]
      }
    }
  ]
};
