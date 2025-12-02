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
      content: `## Example: comparing w vs W on symbol-heavy code

First, we'll press **w** multiple times to see how it stops at every symbol.
Then we'll press **W** to see how it jumps over entire chunks between spaces.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          'auto result = std::max(x, 42) + std::min(y, 7);'
        ],
        initialCursor: { line: 0, col: 0 },
        autoPlaySpeed: 800,
        tracks: [
          { label: 'Comparing w and W', keys: [] }
        ],
        steps: [
          { key: 'w', description: 'w: move from "auto" to "result" (both w and W do the same here).', cursorIndex: 0 },
          { key: 'w', description: 'w: move to "=" (stops at the symbol).', cursorIndex: 0 },
          { key: 'w', description: 'w: move to "std" (stops at the word).', cursorIndex: 0 },
          { key: 'w', description: 'w: move to "::" (stops at punctuation).', cursorIndex: 0 },
          { key: 'w', description: 'w: move to "max" (still inside the function call).', cursorIndex: 0 },
          { key: 'W', description: 'W: now using W, jump over "(x, 42)" as one WORD to "+".', cursorIndex: 0 },
          { key: 'W', description: 'W: jump over the entire "std::min(y, 7);" as one WORD.', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'markdown',
      content: `Notice the difference: **w** stops at every symbol (=, ::, punctuation), requiring many small steps, while **W** treats everything between spaces as one big chunk and jumps much faster!

**Use W to blaze through symbol-heavy code.**`
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
