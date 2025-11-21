import type { Lesson } from '@/core/types';

export const findChar: Lesson = {
  slug: 'find-char',
  title: 'Find characters on a line: f, F, ;, ,',
  categoryId: 'chapter4',
  shortDescription: 'Jump directly to a character on the current line with f/F and repeat with ; and ,.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Find characters instead of counting

Sometimes you know **which character** you want, not how many times to press \`l\`.

In Normal mode:

- **f{char}** – move forward to the next \`{char}\` on this line.
- **F{char}** – move backward to the previous \`{char}\`.
- **;** – repeat the last \`f/F/t/T\` search in the same direction.
- **,** – repeat it in the opposite direction.

This is perfect for lines with multiple commas, quotes, or parentheses.`
    },
    {
      type: 'markdown',
      content: `## Example: hopping between commas

The example uses a \`std::cout\` line with several commas inside a string literal.
Starting near the beginning of the line, we use \`f,\` to jump to the first comma,
then \`;\` and \`,\` to move forward and backward between commas without counting characters.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '',
          'int main() {',
          '    std::cout << values[0] << ", " << values[1] << ", " << values[2] << "\\n";',
          '}'
        ],
        initialCursor: { line: 3, col: 4 }, // on 's' of "std::cout"
        autoPlaySpeed: 850,
        tracks: [
          { label: 'Find commas with f and ; ,', keys: ['f', ',', ';', ';', ','] }
        ],
        steps: [
          { key: 'f', description: 'f: start a forward character search on this line.', cursorIndex: 0 },
          { key: ',', description: '"f," jumps to the first comma inside the string.', cursorIndex: 0 },
          { key: ';', description: '";" repeats the last find, moving to the next comma.', cursorIndex: 0 },
          { key: ';', description: '";" again: jump to the third comma.', cursorIndex: 0 },
          { key: ',', description: '"," goes back to the previous comma.', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['f', ','], desc: 'Find the next comma on this line' },
        { chars: ['F', ','], desc: 'Find the previous comma on this line' },
        { chars: [';'], desc: 'Repeat the last f/F/t/T search (same direction)' },
        { chars: [','], desc: 'Repeat the last f/F/t/T search (opposite direction)' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '',
          'int main() {',
          '    std::cout << values[0] << ", " << values[1] << ", " << values[2] << ", " << values[3] << "\\n";',
          '}'
        ],
        initialCursor: { line: 3, col: 4 },
        goalsRequired: 2,
        enabledCommands: ['h', 'l', '0', '$', 'f', 'F', ';', ','],
        goals: [
          {
            id: 'first-comma',
            type: 'move',
            description: 'Move the cursor to the first comma in the line.',
            validator: (prev, next) => {
              if (next.buffer.length < 4) return false;
              const line = next.buffer[3];
              const firstIndex = line.indexOf(',');
              if (firstIndex < 0) return false;
              return next.cursor.line === 3 && next.cursor.col === firstIndex;
            }
          },
          {
            id: 'last-comma',
            type: 'move',
            description: 'Move the cursor to the last comma in the line.',
            validator: (prev, next) => {
              if (next.buffer.length < 4) return false;
              const line = next.buffer[3];
              const lastIndex = line.lastIndexOf(',');
              if (lastIndex < 0) return false;
              return next.cursor.line === 3 && next.cursor.col === lastIndex;
            }
          }
        ]
      }
    }
  ]
};
