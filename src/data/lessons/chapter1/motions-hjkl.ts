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
      content: `## Example: walking a tiny map with HJKL

The example starts at the top of a small function and moves to a variable line using only **h j k l**.
Notice how every move is a single keypress, keeping your hands on the home row the whole time.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          'int main() {',
          '    int value = 42;',
          '}'
        ],
        initialCursor: { line: 0, col: 0 },
        autoPlaySpeed: 800,
        tracks: [
          { label: 'Move with HJKL', keys: [] }
        ],
        steps: [
          { key: 'j', description: 'j: move down from the function header to the variable line.', cursorIndex: 0 },
          { key: 'k', description: 'k: move back up to the function header.', cursorIndex: 0 },
          { key: 'j', description: 'j: move down again to the variable line.', cursorIndex: 0 },
          { key: 'l', description: 'l: move right inside the line.', cursorIndex: 0 },
          { key: 'l', description: 'l: move right one more character.', cursorIndex: 0 },
          { key: 'h', description: 'h: move left to step back by one.', cursorIndex: 0 }
        ]
      }
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
            description: 'Move the cursor to the first T (the capital T at the start) in "TARGET" on the last line.',
            validator: (prev, next) => {
              return next.cursor.line === 2 && next.cursor.col === 3;
            }
          }
        ]
      }
    }
  ]
};
