import type { Lesson } from '@/core/types';

export const modesMovementMiniReview: Lesson = {
  slug: 'modes-movement-mini-review',
  title: 'Mini Review: Move then Insert',
  categoryId: 'chapter1',
  shortDescription: 'Combine movement and Insert mode to fix a tiny program.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## The Normal → Insert rhythm

By now you know how to:

- Move with **h j k l**.
- Jump to key spots in a line with **0, ^, $**.
- Enter Insert mode with **i, a, o, O** and leave it with **Esc**.

Real editing in Vim follows a simple rhythm:

1. In **Normal**, move to where the change should happen.
2. Enter **Insert** briefly to type or fix text.
3. Press **Esc** to come back to **Normal** for the next move.

In this mini review, you will fix a small program using this rhythm.`
    },
    {
      type: 'markdown',
      content: `## Example snippet

\`\`\`js
// Fix this tiny program using Normal + Insert motions only.

function greet(name) {
  const message = 'Hello, ' + name
  // PRINT GREETING
  console.log(message)
}
\`\`\`

Your tasks:

- Add missing semicolons.
- Add a TODO comment line for the log.

Move in **Normal**, then dip into **Insert** just long enough to make each fix.`
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['h'], desc: 'Move left' },
        { chars: ['j'], desc: 'Move down' },
        { chars: ['k'], desc: 'Move up' },
        { chars: ['l'], desc: 'Move right' },
        { chars: ['0'], desc: 'Jump to column 0 of the line' },
        { chars: ['^'], desc: 'Jump to the first non-blank character' },
        { chars: ['$'], desc: 'Jump to the end of the line' },
        { chars: ['i'], desc: 'Insert before the cursor' },
        { chars: ['a'], desc: 'Insert after the cursor' },
        { chars: ['o'], desc: 'Open new line below and insert' },
        { chars: ['O'], desc: 'Open new line above and insert' },
        { chars: ['Esc'], desc: 'Return to Normal mode' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          '// Fix this tiny program using Normal + Insert motions only.',
          '',
          'function greet(name) {',
          "  const message = 'Hello, ' + name",
          '  // PRINT GREETING',
          '  console.log(message)',
          '}'
        ],
        initialCursor: { line: 2, col: 0 },
        goalsRequired: 3,
        enabledCommands: ['h', 'j', 'k', 'l', '0', '^', '$', 'i', 'a', 'o', 'O', 'Escape'],
        goals: [
          {
            id: 'add-semicolon-message',
            type: 'insert',
            description: 'Add a semicolon at the end of the line that defines "message".',
            validator: (prev, next) => {
              if (next.buffer.length < 4) return false;
              const line = next.buffer[3];
              const trimmed = line.trim();
              return trimmed.startsWith("const message") && trimmed.endsWith(';');
            }
          },
          {
            id: 'add-semicolon-log',
            type: 'insert',
            description: 'Add a semicolon at the end of the console.log line.',
            validator: (prev, next) => {
              if (next.buffer.length < 6) return false;
              const line = next.buffer[5];
              const trimmed = line.trim();
              return trimmed.startsWith('console.log') && trimmed.endsWith(';');
            }
          },
          {
            id: 'add-todo-comment',
            type: 'insert',
            description: 'Add a TODO comment line like "// TODO: print greeting" (for the log).',
            validator: (prev, next) => {
              const hasTodo = next.buffer.some(line =>
                line.includes('// TODO: print greeting')
              );
              return hasTodo;
            }
          }
        ]
      }
    }
  ]
};
