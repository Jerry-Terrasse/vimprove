import type { Lesson } from '@/core/types';

export const motionsWords: Lesson = {
  slug: 'motions-words',
  title: 'Move by words: w, b, e',
  categoryId: 'basics',
  shortDescription: 'Jump over whole words instead of moving character by character.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Why move by words?

Using **h** and **l** to move one character at a time is slow.

Vim gives you **word motions** to skip bigger chunks:

- **w** – jump to the **start of the next word**
- **b** – jump **back** to the start of the previous word
- **e** – jump to the **end of the current/next word**

A "word" here is a run of letters, digits, or underscores separated by spaces or punctuation.`
    },
    {
      type: 'markdown',
      content: `## Playable example: walking through a line

Take this line:

\`\`\`js
const fullName = firstName + lastName;
\`\`\`

Imagine the cursor starts on the \`c\` in \`const\`.

Try this sequence:

1. Press **w** repeatedly:
   - 1st \`w\` → \`fullName\`
   - 2nd \`w\` → \`=\`
   - 3rd \`w\` → \`firstName\`
   - 4th \`w\` → \`+\`
   - 5th \`w\` → \`lastName\`

2. From the start of \`firstName\`, press **e**:
   - Cursor jumps to the **last letter** of \`firstName\`.

3. From the end of \`firstName\`, press **b**:
   - Cursor jumps back to the start of \`firstName\`.

The animation can show a small highlight on each word as \`w\`, \`b\`, and \`e\` move the cursor along.`
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['w'], desc: 'Jump to the start of the next word' },
        { chars: ['b'], desc: 'Jump back to the start of the previous word' },
        { chars: ['e'], desc: 'Jump to the end of the current/next word' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          "let firstName = 'Ada';",
          "let lastName = 'Lovelace';",
          'const fullName = firstName + lastName;'
        ],
        initialCursor: { line: 0, col: 0 },
        goalsRequired: 2,
        enabledCommands: ['h', 'j', 'k', 'l', 'w', 'b', 'e'],
        goals: [
          {
            id: 'reach-lastName-start',
            type: 'move',
            description: 'Move the cursor to the start of the word "lastName" on the second line.',
            validator: (prev, next) => {
              if (next.buffer.length < 2) return false;
              return next.cursor.line === 1 && next.cursor.col === 4;
            }
          },
          {
            id: 'reach-firstName-end',
            type: 'move',
            description: 'Move the cursor to the end of the word "firstName" on the third line.',
            validator: (prev, next) => {
              if (next.buffer.length < 3) return false;
              return next.cursor.line === 2 && next.cursor.col === 25;
            }
          }
        ]
      }
    }
  ]
};
