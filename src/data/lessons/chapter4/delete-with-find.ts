import type { Lesson } from '@/core/types';

export const deleteWithFind: Lesson = {
  slug: 'delete-with-find',
  title: 'Delete using find motions: d f/t',
  categoryId: 'chapter4',
  shortDescription: 'Combine the delete operator d with f/t to remove precise ranges inside a line.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Delete to a character, not just by words

Once you know **f** and **t**, you can combine them with **d**:

- **df{char}** – delete from cursor **through** the next \`{char}\`.
- **dt{char}** – delete from cursor **until just before** the next \`{char}\`.

Typical uses:

- \`df;\` – delete from here up to the semicolon.
- \`dt)\` – delete everything inside parentheses, but keep the closing \`) \`.`
    },
    {
      type: 'markdown',
      content: `## Code we will edit

We start from a C++ vector initialization:

\`\`\`cpp
#include <vector>

int main() {
    std::vector<int> values = {1, 2, 3, 4};
}
\`\`\`

We will delete the initializer \`= {1, 2, 3, 4};\` with a single **df;** from the equals sign.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          '#include <vector>',
          '',
          'int main() {',
          '    std::vector<int> values = {1, 2, 3, 4};',
          '}'
        ],
        // on '=' in the initialization
        initialCursor: { line: 3, col: 28 },
        autoPlaySpeed: 850,
        tracks: [
          { label: 'Delete with d f{char}', keys: ['d', 'f', ';'] }
        ],
        steps: [
          { key: 'd', description: 'd: start the delete operator on the equals sign.', cursorIndex: 0 },
          { key: 'f', description: 'f: prepare to find a character forward.', cursorIndex: 0 },
          { key: ';', description: '"df;" deletes from "=" through the semicolon, removing the initializer.', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['d', 'f', ';'], desc: 'Delete from cursor through the next semicolon' },
        { chars: ['d', 't', ')'], desc: 'Delete from cursor until just before the closing parenthesis' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '',
          'int main() {',
          '    auto result = func(10, 20, 30);',
          '    int debug = 42;',
          '}'
        ],
        // somewhere near the start of "func"
        initialCursor: { line: 3, col: 4 },
        goalsRequired: 2,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          '0', '$',
          'f', 't',
          'd',
          'Escape'
        ],
        goals: [
          {
            id: 'clear-func-args',
            type: 'delete',
            description: 'Remove the arguments inside func(…) so the call becomes func().',
            validator: (prev, next) => {
              if (next.buffer.length < 4) return false;
              const line = next.buffer[3];
              const trimmed = line.trim();
              // Expect something like: auto result = func();
              return trimmed.includes('func(') &&
                trimmed.includes(');') &&
                !trimmed.match(/func\([^0-9A-Za-z]*[0-9A-Za-z]/);
            }
          },
          {
            id: 'remove-debug-init',
            type: 'delete',
            description: 'Remove the initializer "= 42;" from the debug line (keep the variable name).',
            validator: (prev, next) => {
              if (next.buffer.length < 5) return false;
              const line = next.buffer[4];
              const trimmed = line.trim();
              // Should still declare debug, but without "="
              return trimmed.startsWith('int debug') && !trimmed.includes('=');
            }
          }
        ]
      }
    }
  ]
};
