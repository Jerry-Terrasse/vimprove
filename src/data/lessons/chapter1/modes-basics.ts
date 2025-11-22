import type { Lesson } from '@/core/types';

export const modesBasics: Lesson = {
  slug: 'modes-basics',
  title: 'Modes: Normal vs Insert',
  categoryId: 'chapter1',
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
      content: `## Example: switching between Normal and Insert

In the example the cursor starts near a small C++ snippet.
We enter Insert with \`i\`, type a few characters, return with **Esc**,
jump to the end of the line, and enter Insert again with \`a\` to add a trailing comment.
Watch how Insert changes the buffer immediately, while Esc drops you back to command mode.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '',
          'int main() {',
          '    int value = 42;',
          '}'
        ],
        initialCursor: { line: 3, col: 4 },
        autoPlaySpeed: 900,
        tracks: [
          { label: 'Insert vs Normal', keys: [] }
        ],
        steps: [
          { key: 'i', description: 'i: enter Insert mode before "int".', cursorIndex: 0 },
          { key: '/', description: 'Type "/" – the code changes while in Insert.', cursorIndex: 0 },
          { key: 'Escape', description: 'Escape: go back to Normal mode.', cursorIndex: 0 },
          { key: '$', description: '$: jump to the end of the line in Normal mode.', cursorIndex: 0 },
          { key: 'a', description: 'a: enter Insert mode after the semicolon.', cursorIndex: 0 },
          { key: '/', description: 'Type "/" to start a trailing comment.', cursorIndex: 0 },
          { key: 'Escape', description: 'Escape: return to Normal again.', cursorIndex: 0 }
        ]
      }
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
        goalsRequired: 2,
        enabledCommands: ['h', 'j', 'k', 'l', 'i', 'a', 'o', 'O', 'Escape'],
        goals: [
          {
            id: 'enter-insert-mode',
            type: 'insert',
            description: 'Enter Insert mode using i, a, o, or O.',
            validator: (_prev, next) => {
              return next.mode === 'insert';
            }
          },
          {
            id: 'return-normal-mode',
            type: 'custom',
            description: 'Return to Normal mode by pressing Escape.',
            validator: (_prev, next, lastCommand) => {
              return next.mode === 'normal' && lastCommand?.type === 'mode-switch' && lastCommand.to === 'normal';
            }
          }
        ]
      }
    }
  ]
};
