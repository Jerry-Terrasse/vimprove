import type { Lesson } from '@/core/types';

export const motionsLineBounds: Lesson = {
  slug: 'motions-line-bounds',
  title: 'Line Bounds: 0, ^, $',
  categoryId: 'chapter1',
  shortDescription: 'Jump to the start, code start, or end of a line.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Three important spots in a line

When editing code, you often need three positions on a line:

- Column **0**: the very start of the line.
- First **non-blank** character (after indentation).
- The **last** character of the line.

Vim gives you three motions for this:

- **0** → go to column 0 (absolute start).
- **^** → go to the first non-blank character.
- **$** → go to the end of the line.

You can use **h** and **l** to make small adjustments after jumping.`
    },
    {
      type: 'markdown',
      content: `## Example line

\`\`\`js
    const value = 42;   // indented line
\`\`\`

On this line:

- \`0\` jumps to the very first column (before the spaces).
- \`^\` jumps to the **c** in \`const\`.
- \`$\` jumps to the last letter of \`line\`.

Try to feel the difference:

- \`0\` cares about the **text row**.
- \`^\` cares about the **code start**.
- \`$\` cares about the **end**.`
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['0'], desc: 'Jump to column 0 of the current line' },
        { chars: ['^'], desc: 'Jump to the first non-blank character' },
        { chars: ['$'], desc: 'Jump to the end of the current line' },
        { chars: ['h'], desc: 'Move left (fine adjust)' },
        { chars: ['l'], desc: 'Move right (fine adjust)' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          'function demo() {',
          '    const value = 42;   // indented line',
          '}'
        ],
        initialCursor: { line: 1, col: 10 },
        goalsRequired: 3,
        enabledCommands: ['h', 'j', 'k', 'l', '0', '^', '$'],
        goals: [
          {
            id: 'go-to-absolute-start',
            type: 'move',
            description: 'Move the cursor to column 0 on the second line.',
            validator: (prev, next) => {
              if (next.buffer.length < 2) return false;
              return next.cursor.line === 1 && next.cursor.col === 0;
            }
          },
          {
            id: 'go-to-first-code-char',
            type: 'move',
            description: 'Move the cursor to the first non-blank character on the second line.',
            validator: (prev, next) => {
              if (next.buffer.length < 2) return false;
              return next.cursor.line === 1 && next.cursor.col === 4;
            }
          },
          {
            id: 'go-to-line-end',
            type: 'move',
            description: 'Move the cursor to the last character of the second line.',
            validator: (prev, next) => {
              if (next.buffer.length < 2) return false;
              const line = next.buffer[1];
              if (!line.length) return false;
              return next.cursor.line === 1 && next.cursor.col === line.length - 1;
            }
          }
        ]
      }
    }
  ]
};
