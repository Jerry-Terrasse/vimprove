import type { Lesson } from '@/core/types';

export const smallEditsChars: Lesson = {
  slug: 'small-edits-chars',
  title: 'Small edits: x, s, r',
  categoryId: 'chapter2',
  shortDescription: 'Use x, s, and r to clean up tiny mistakes without full Insert mode.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Three tools for tiny mistakes

For one-character fixes you do not need a big Insert session.

In Normal mode:

- **x** – delete the character under the cursor.
- **s** – delete the character under the cursor **and** enter Insert mode.
- **r{char}** – replace the character under the cursor with \`{char}\` and stay in Normal.

They are perfect for things like:

- Changing \`==\` into \`===\`.
- Fixing a single letter in a word.
- Removing an extra symbol.`
    },
    {
      type: 'markdown',
      content: `## Example: quick single-character fixes

The example line-up shows three tiny edits in one pass:
use **x** to drop a digit, **r** to replace a number in place,
and **s** to swap a wrong letter inside a string while briefly entering Insert mode.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          'int main() {',
          '    int value = 10;',
          '    int count = 0;',
          '    std::string text = "Hxllo";',
          '}'
        ],
        initialCursor: { line: 1, col: 4 },
        autoPlaySpeed: 850,
        tracks: [
          { label: 'Small edits: x, r, s', keys: [] }
        ],
        steps: [
          { key: 'w', description: 'w: jump to "int".', cursorIndex: 0 },
          { key: 'w', description: 'w: jump to "value".', cursorIndex: 0 },
          { key: 'w', description: 'w: jump to "10".', cursorIndex: 0 },
          { key: 'x', description: 'x: delete the "0" to make the value 1.', cursorIndex: 0 },
          { key: 'j', description: 'j: move down to the "count" line.', cursorIndex: 0 },
          { key: 'w', description: 'w: jump to "int".', cursorIndex: 0 },
          { key: 'w', description: 'w: jump to "count".', cursorIndex: 0 },
          { key: 'w', description: 'w: jump to the "0".', cursorIndex: 0 },
          { key: 'r', description: 'r: prepare to replace the digit under the cursor.', cursorIndex: 0 },
          { key: '1', description: 'Type "1" so the assignment becomes count = 1.', cursorIndex: 0 },
          { key: 'j', description: 'j: move down to the string line.', cursorIndex: 0 },
          { key: 'w', description: 'w: jump to "std::string".', cursorIndex: 0 },
          { key: 'w', description: 'w: jump to "text".', cursorIndex: 0 },
          { key: 'w', description: 'w: jump to the string literal "Hxllo".', cursorIndex: 0 },
          { key: 'l', description: 'l: move onto the wrong letter "x".', cursorIndex: 0 },
          { key: 's', description: 's: delete "x" and enter Insert mode at that spot.', cursorIndex: 0 },
          { key: 'e', description: 'Type "e" to fix the word to "Hello".', cursorIndex: 0 },
          { key: 'Escape', description: 'Escape: back to Normal after the small edit.', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['x'], desc: 'Delete character under cursor' },
        { chars: ['s'], desc: 'Delete character under cursor and enter Insert' },
        { chars: ['r'], desc: 'Replace character under cursor with next typed character' },
        { chars: ['Esc'], desc: 'Back to Normal mode' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          'if (count == 0) {',
          '  console.log("Zerro")',
          '}'
        ],
        initialCursor: { line: 0, col: 0 },
        goalsRequired: 2,
        enabledCommands: ['h', 'j', 'k', 'l', 'x', 's', 'r', 'i', 'a', 'Escape'],
        goals: [
          {
            id: 'make-strict-equals',
            type: 'change',
            description: 'Change "==" into "===" in the if condition.',
            validator: (prev, next) => {
              if (!next.buffer.length) return false;
              const line = next.buffer[0];
              return line.includes('===') && !line.includes(' == ') && !line.includes(' == 0');
            }
          },
          {
            id: 'fix-zerro',
            type: 'change',
            description: 'Fix the string so that it reads "Zero" instead of "Zerro".',
            validator: (prev, next) => {
              if (next.buffer.length < 2) return false;
              const line = next.buffer[1];
              return line.includes('"Zero"') && !line.includes('"Zerro"');
            }
          }
        ]
      }
    }
  ]
};
