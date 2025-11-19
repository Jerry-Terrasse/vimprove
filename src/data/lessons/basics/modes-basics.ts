import type { Lesson } from '@/core/types';

export const modesBasics: Lesson = {
  slug: 'modes-basics',
  title: 'Modes: Normal vs Insert',
  categoryId: 'basics',
  shortDescription: 'Learn how Vim modes work and how to enter and leave Insert mode.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Normal vs Insert

In Vim you are not always "just typing". Vim has **modes**.

- **Normal mode** is for moving around and running commands.
- **Insert mode** is for typing text, like in a regular editor.
- Press **Esc** any time to go back to Normal mode and cancel what you were doing.

A common pattern is:

1. Stay in **Normal** most of the time.
2. Jump to where you want to edit.
3. Enter **Insert** briefly to add or change text.
4. Press **Esc** to return to Normal and keep moving.`
    },
    {
      type: 'markdown',
      content: `## Four ways to start inserting

From Normal mode you can enter Insert mode in different ways:

- **i** – insert *before* the cursor on the current line.
- **a** – insert *after* the cursor on the current line.
- **o** – open a new line *below* the current one and start inserting there.
- **O** – open a new line *above* the current one and start inserting there.
- **Esc** – leave Insert mode and go back to Normal.

You can read them as tiny English phrases:

- \`i\` → "insert here, before the cursor"
- \`a\` → "append after the cursor"
- \`o\` → "open below"
- \`O\` → "Open above" (same, but above)`
    },
    {
      type: 'markdown',
      content: `## Example: fixing a tiny snippet

Given this code:

\`\`\`js
// Lesson 1.1 - modes
const message = 'ready';
console.log(message);
\`\`\`

One efficient way to extend it is:

1. Make sure you are in Normal mode (press **Esc** once, just in case).
2. Move the cursor to the comment line and insert the word \`Vim\` in the sentence using **i** or **a**.
3. Move to \`console.log(message);\` and press **o** to open a new line *below*.
4. Type \`console.log('done');\`.
5. Press **Esc** to leave Insert mode.

Notice how you **start in Normal**, dip into **Insert** to type, then come back to **Normal** with **Esc**. That rhythm is the core of Vim editing.`
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['Esc'], desc: 'Return to Normal mode' },
        { chars: ['i'], desc: 'Insert before cursor' },
        { chars: ['a'], desc: 'Insert after cursor' },
        { chars: ['o'], desc: 'Open new line below and insert' },
        { chars: ['O'], desc: 'Open new line above and insert' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          '// Lesson 1.1 - modes',
          "const message = 'ready';",
          '// LOG',
          'console.log(message);'
        ],
        initialCursor: { line: 1, col: 0 },
        goalsRequired: 3,
        enabledCommands: ['h', 'j', 'k', 'l', 'i', 'a', 'o', 'O', 'Escape'],
        goals: [
          {
            id: 'add-vim-word',
            type: 'insert',
            description: 'Add the word "Vim" to the lesson comment on the first line.',
            validator: (_prev, next) => {
              if (!next.buffer.length) return false;
              const first = next.buffer[0];
              return first.includes('Lesson 1.1') && first.toLowerCase().includes('vim');
            }
          },
          {
            id: 'add-todo-comment',
            type: 'insert',
            description: 'Add a TODO comment line, for example "// TODO: log the message".',
            validator: (_prev, next) => {
              return next.buffer.some(line =>
                line.includes('// TODO: log the message')
              );
            }
          },
          {
            id: 'add-done-log',
            type: 'insert',
            description: 'Add a second log call that prints "done".',
            validator: (_prev, next) => {
              const text = next.buffer.join('\n');
              return (
                text.includes("console.log('done')") ||
                text.includes('console.log("done")')
              );
            }
          }
        ]
      }
    }
  ]
};
