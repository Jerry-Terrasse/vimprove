import type { Lesson } from '@/core/types';

export const motionsWORDs: Lesson = {
  slug: 'motions-WORDs',
  title: 'Move by WORDs: W, B, E',
  categoryId: 'basics',
  shortDescription: 'Jump across noisy code using WORD motions that treat symbols as part of the chunk.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Words vs WORDs

So far, **w/b/e** move by "words" (letters, digits, underscores).

Sometimes code has lots of symbols:

\`\`\`js
t = Math.max(i, 4200), Math.min(j, 4900);
\`\`\`

Lowercase motions stop at punctuation.

**WORD motions** treat everything between spaces as **one big chunk**:

- **W** – next WORD start
- **B** – previous WORD start
- **E** – WORD end

A WORD is "anything until the next space".`
    },
    {
      type: 'markdown',
      content: `## Playable example: two cursors race

Use this line:

\`\`\`js
t = Math.max(i, 4200), Math.min(j, 4900);
\`\`\`

Imagine two cursors starting on the \`t\`:

- Cursor A uses **w**.
- Cursor B uses **W**.

Step through:

1. Both press their motion repeatedly.
2. Cursor A stops at \`=\`, then at \`Math\`, then at \`.\`, then at \`max\`, then at \`(\`, etc.
3. Cursor B goes:
   - 1st \`W\` → whole \`=\` + \`Math.max(i,\` as one WORD
   - 2nd \`W\` → \`4200),\`
   - 3rd \`W\` → \`Math.min(j,\`
   - 4th \`W\` → \`4900);\`

The animation makes the difference obvious:
**WORDS blaze through symbol-heavy code.**`
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['w'], desc: 'Next word start (small word)' },
        { chars: ['W'], desc: 'Next WORD start (big chunk)' },
        { chars: ['B'], desc: 'Previous WORD start' },
        { chars: ['E'], desc: 'WORD end' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          't = Math.max(i, 4200), Math.min(j, 4900);'
        ],
        initialCursor: { line: 0, col: 0 },
        goalsRequired: 2,
        enabledCommands: ['h', 'l', 'w', 'b', 'e', 'W', 'B', 'E'],
        goals: [
          {
            id: 'reach-first-math',
            type: 'move',
            description: 'Move the cursor to the M in the first "Math".',
            validator: (prev, next) => {
              if (!next.buffer.length) return false;
              return next.cursor.line === 0 && next.cursor.col === 4;
            }
          },
          {
            id: 'reach-second-math',
            type: 'move',
            description: 'Move the cursor to the M in the second "Math".',
            validator: (prev, next) => {
              if (!next.buffer.length) return false;
              return next.cursor.line === 0 && next.cursor.col === 23;
            }
          }
        ]
      }
    }
  ]
};
