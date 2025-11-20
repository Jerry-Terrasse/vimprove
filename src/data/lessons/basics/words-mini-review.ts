import type { Lesson } from '@/core/types';

export const wordsMiniReview: Lesson = {
  slug: 'words-mini-review',
  title: 'Mini review: word motions + small edits',
  categoryId: 'basics',
  shortDescription: 'Combine word motions with x, s, and r to quickly clean up a small snippet.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Putting it together

You now know how to:

- Move by **words** with **w, b, e**.
- Jump by **WORDs** with **W, B, E**.
- Fix tiny mistakes with **x, s, r**.
- Briefly enter Insert mode with **i/a** and exit with **Esc**.

This mini review lets you clean up a small piece of code using any combo you like.

Focus on:

- Jumping with word/WORD motions instead of many \`h/l\`.
- Using \`x/s/r\` for tiny edits, not long Insert sessions.`
    },
    {
      type: 'markdown',
      content: `## Playable example: quick bugfix session

Start from:

\`\`\`js
let totalCount = 0;
let curentCount = 1;  // typo
if (curentCount == totalCount) {
  console.log("Match!");
}
\`\`\`

Possible animation:

1. Use **W** to jump across \`let\` and the variable name quickly.
2. Land on \`curentCount\` and use **w/b/e** to align the cursor.
3. Use **s** or **i** to fix the typo \`curentCount\` → \`currentCount\`.
4. Use word motions to reach the \`==\` and make it \`===\` with **x** or **r**.
5. Finish with a tiny comment line using **o**:

\`\`\`js
// TODO: check other counters
\`\`\`

The animation should highlight how little time is spent in Insert mode.`
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['w'], desc: 'Next word start' },
        { chars: ['b'], desc: 'Previous word start' },
        { chars: ['e'], desc: 'Word end' },
        { chars: ['W'], desc: 'Next WORD start' },
        { chars: ['B'], desc: 'Previous WORD start' },
        { chars: ['E'], desc: 'WORD end' },
        { chars: ['x'], desc: 'Delete character' },
        { chars: ['s'], desc: 'Substitute character and insert' },
        { chars: ['r'], desc: 'Replace character' },
        { chars: ['i'], desc: 'Insert before cursor' },
        { chars: ['a'], desc: 'Insert after cursor' },
        { chars: ['o'], desc: 'Open new line below and insert' },
        { chars: ['Esc'], desc: 'Back to Normal' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          'let totalCount = 0;',
          'let curentCount = 1;  // typo',
          'if (curentCount == totalCount) {',
          '  console.log("Match!");',
          '}'
        ],
        initialCursor: { line: 0, col: 0 },
        goalsRequired: 3,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          'w', 'b', 'e',
          'W', 'B', 'E',
          'x', 's', 'r',
          'i', 'a', 'o',
          'Escape'
        ],
        goals: [
          {
            id: 'fix-curentCount',
            type: 'change',
            description: 'Rename all occurrences of "curentCount" to "currentCount".',
            validator: (prev, next) => {
              const text = next.buffer.join('\n');
              return text.includes('currentCount') && !text.includes('curentCount');
            }
          },
          {
            id: 'strict-equals-again',
            type: 'change',
            description: 'Change "==" to "===" in the if condition.',
            validator: (prev, next) => {
              if (next.buffer.length < 3) return false;
              const line = next.buffer[2];
              return line.includes('===') && !line.includes(' == ');
            }
          },
          {
            id: 'add-todo-comment-review',
            type: 'insert',
            description: 'Add a TODO comment line like "// TODO: check other counters".',
            validator: (prev, next) => {
              return next.buffer.some(line =>
                line.includes('// TODO: check other counters')
              );
            }
          }
        ]
      }
    }
  ]
};
