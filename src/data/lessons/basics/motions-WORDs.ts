import type { Lesson } from '@/core/types';

export const motionsWORDs: Lesson = {
  slug: 'motions-WORDs',
  title: 'Move by WORDs: W, B, E',
  categoryId: 'chapter2',
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

Watch how **w** (lowercase) and **W** (uppercase) behave differently on symbol-heavy code.

The **blue cursor** uses \`w\` (stops at punctuation).
The **green cursor** uses \`W\` (treats everything between spaces as one chunk).`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: ['t = Math.max(i, 4200), Math.min(j, 4900);'],
        initialCursor: { line: 0, col: 0 },
        autoPlaySpeed: 800,
        tracks: [
          { label: 'Using w', keys: [], color: 'bg-blue-500' },
          { label: 'Using W', keys: [], color: 'bg-green-500' }
        ],
        steps: [
          { key: 'w', description: 'Cursor A (w): jumps to "="', cursorIndex: 0 },
          { key: 'W', description: 'Cursor B (W): jumps to "Math.max(i,"', cursorIndex: 1 },
          { key: 'w', description: 'Cursor A (w): jumps to "Math"', cursorIndex: 0 },
          { key: 'w', description: 'Cursor A (w): jumps to "."', cursorIndex: 0 },
          { key: 'W', description: 'Cursor B (W): jumps to "4200),"', cursorIndex: 1 },
          { key: 'w', description: 'Cursor A (w): jumps to "max"', cursorIndex: 0 },
          { key: 'w', description: 'Cursor A (w): jumps to "("', cursorIndex: 0 },
          { key: 'W', description: 'Cursor B (W): jumps to "Math.min(j,"', cursorIndex: 1 },
          { key: 'w', description: 'Cursor A (w): jumps to "i"', cursorIndex: 0 },
          { key: 'w', description: 'Cursor A (w): jumps to ","', cursorIndex: 0 },
          { key: 'W', description: 'Cursor B (W): jumps to "4900);"', cursorIndex: 1 },
          { key: 'w', description: 'Cursor A (w): jumps to "4200"', cursorIndex: 0 },
          { key: 'w', description: 'Cursor A (w): jumps to ")"', cursorIndex: 0 },
          { key: 'w', description: 'Cursor A (w): jumps to ","', cursorIndex: 0 },
          { key: 'w', description: 'Cursor A (w): jumps to "Math" (2nd)', cursorIndex: 0 },
          { key: 'w', description: 'Cursor A (w): jumps to "." (2nd)', cursorIndex: 0 },
          { key: 'w', description: 'Cursor A (w): jumps to "min"', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'markdown',
      content: `Notice how **W** reaches the end in just 4 jumps, while **w** needs many more steps!

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
            validator: (_prev, next) => {
              if (!next.buffer.length) return false;
              return next.cursor.line === 0 && next.cursor.col === 4;
            }
          },
          {
            id: 'reach-second-math',
            type: 'move',
            description: 'Move the cursor to the M in the second "Math".',
            validator: (_prev, next) => {
              if (!next.buffer.length) return false;
              return next.cursor.line === 0 && next.cursor.col === 23;
            }
          }
        ]
      }
    }
  ]
};
