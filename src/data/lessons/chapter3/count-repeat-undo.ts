import type { Lesson } from '@/core/types';

export const countRepeatUndo: Lesson = {
  slug: 'count-repeat-undo',
  title: 'Counts, repeat, undo',
  categoryId: 'chapter3',
  shortDescription: 'Use counts, dot-repeat, and undo/redo to do more with fewer keystrokes.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Do it once, then repeat

Vim gives you two big boosters:

- **Counts**: prefix a command with a number to run it multiple times.
  - \`3w\` – move 3 words forward.
  - \`2dw\` – delete 2 words in one go.
- **Dot repeat** (\`.\`):
  - repeats the **last change** (not just the last key).

And if you go too far:

- **u** – undo the last change.
- **Ctrl-r** – redo the last undone change.

The idea:

1. Make one good change once.
2. Repeat it with \`.\` or a count.
3. Fix mistakes with \`u\` and \`Ctrl-r\`.`
    },
    {
      type: 'markdown',
      content: `## Example: count, repeat, undo

The example edits a series of initializers.
We change one value to 42, then use **.** to repeat the change on the next lines,
and finally use **u** / **Ctrl-r** to demonstrate undo and redo on the repeated edits.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          'int main() {',
          '    int value1 = 0;',
          '    int value2 = 0;',
          '    int value3 = 0;',
          '    int value4 = 0;',
          '}'
        ],
        initialCursor: { line: 1, col: 4 },
        autoPlaySpeed: 900,
        tracks: [
          { label: 'Counts + dot + undo', keys: [] }
        ],
        steps: [
          { key: 'w', description: 'w: jump to "int".', cursorIndex: 0 },
          { key: 'w', description: 'w: jump to "value1".', cursorIndex: 0 },
          { key: 'w', description: 'w: jump to "0;".', cursorIndex: 0 },
          { key: 'c', description: 'c: start a change on the initializer.', cursorIndex: 0 },
          { key: 'w', description: 'w: cw – delete "0;".', cursorIndex: 0 },
          { key: '4', description: 'Type "4" in Insert mode.', cursorIndex: 0 },
          { key: '2', description: 'Type "2" to make the value 42;', cursorIndex: 0 },
          { key: ';', description: 'Type ";" to finish the statement.', cursorIndex: 0 },
          { key: 'Escape', description: 'Escape: back to Normal. One line is fixed.', cursorIndex: 0 },

          { key: 'j', description: 'j: move down to value2.', cursorIndex: 0 },
          { key: '.', description: '.: repeat the last change – set initializer to 42 again.', cursorIndex: 0 },

          { key: 'j', description: 'j: move down to value3.', cursorIndex: 0 },
          { key: '.', description: '.: repeat once more for value3.', cursorIndex: 0 },

          { key: 'u', description: 'u: undo – revert the last change on value3.', cursorIndex: 0 },
          { key: 'Ctrl-r', description: 'Ctrl-r: redo – apply the change again.', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['1-9'], desc: 'Counts before a motion or operator' },
        { chars: ['.'], desc: 'Repeat the last change' },
        { chars: ['u'], desc: 'Undo last change' },
        { chars: ['Ctrl-r'], desc: 'Redo last undone change' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '',
          'int main() {',
          '    int value1 = 0;',
          '    int value2 = 0;',
          '    int value3 = 0;',
          '    int value4 = 0;',
          '    std::cout << value1 << ", "',
          '              << value2 << ", "',
          '              << value3 << ", "',
          '              << value4 << "\\n";',
          '}'
        ],
        initialCursor: { line: 3, col: 4 },
        goalsRequired: 1,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          'w', 'b', 'e',
          '0', '^', '$',
          'c', 'd',
          '1', '2', '3', '4', '5', '6', '7', '8', '9',
          '.', 'u', 'Ctrl-r',
          'i', 'a', 'o', 'O',
          'Escape'
        ],
        goals: [
          {
            id: 'all-values-42',
            type: 'change',
            description: 'Change all four initializers so that value1..value4 are initialized to 42.',
            validator: (prev, next) => {
              if (next.buffer.length < 7) return false;
              const lines = next.buffer.slice(3, 7);
              return lines.every(line => line.includes('= 42;'));
            }
          }
        ]
      }
    }
  ]
};
