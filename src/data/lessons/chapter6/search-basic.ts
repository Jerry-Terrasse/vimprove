import type { Lesson } from '@/core/types';

export const searchBasic: Lesson = {
  slug: 'search-basic',
  title: 'Search and repeat: /, n, N, *, #',
  categoryId: 'chapter6',
  shortDescription: 'Use / and * to jump between matches, and repeat with n/N.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Search across the buffer

Instead of moving line by line, you can **search** for what you want:

- **/pattern** – search forward for \`pattern\`.
- **?pattern** – search backward.
- **n** – jump to the next match.
- **N** – jump to the previous match.

Vim can also search for the **word under the cursor**:

- *** – search forward for the word under the cursor.
- **#** – search backward for the word under the cursor.`
    },
    {
      type: 'markdown',
      content: `## Playable example: jump through all occurrences

We use this C++ code:

\`\`\`cpp
#include <iostream>
#include <string>

int main() {
    std::string name = "Ada";
    std::string log1 = "User: Ada";
    std::string log2 = "Hello, Ada!";
}
\`\`\`

We will put the cursor on the first **"Ada"**, then use *** and n/N to jump between all matches.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '#include <string>',
          '',
          'int main() {',
          '    std::string name = "Ada";',
          '    std::string log1 = "User: Ada";',
          '    std::string log2 = "Hello, Ada!";',
          '}'
        ],
        // On the A in the first "Ada"
        initialCursor: { line: 4, col: 24 },
        autoPlaySpeed: 900,
        tracks: [
          { label: 'Search with * and n/N', keys: ['*', 'n', 'n', 'N', 'N'] }
        ],
        steps: [
          { key: '*', description: '*: search for the word "Ada" under the cursor and jump to the next match.', cursorIndex: 0 },
          { key: 'n', description: 'n: jump to the next "Ada".', cursorIndex: 0 },
          { key: 'n', description: 'n: jump again to the next "Ada".', cursorIndex: 0 },
          { key: 'N', description: 'N: go back to the previous match.', cursorIndex: 0 },
          { key: 'N', description: 'N: go back to the first "Ada".', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['/', 'pattern'], desc: 'Search forward for a pattern' },
        { chars: ['n'], desc: 'Jump to the next search match' },
        { chars: ['N'], desc: 'Jump to the previous search match' },
        { chars: ['*'], desc: 'Search forward for the word under the cursor' },
        { chars: ['#'], desc: 'Search backward for the word under the cursor' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '',
          'int main() {',
          '    // TODO: load config',
          '    // TODO: connect to database',
          '    // TODO: start server',
          '    std::cout << "Server started" << std::endl;',
          '}'
        ],
        initialCursor: { line: 2, col: 0 },
        goalsRequired: 2,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          'w', 'b', 'e',
          '0', '^', '$',
          '/', '?', 'n', 'N', '*', '#',
          'i', 'a', 'I', 'A', 'o', 'O',
          'x', 'd', 'c',
          '.',
          'u', 'Ctrl-r',
          '1', '2', '3', '4', '5', '6', '7', '8', '9',
          'Escape',
          'Backspace', 'Enter'
        ],
        goals: [
          {
            id: 'replace-todo-with-done',
            type: 'change',
            description: 'Replace all occurrences of "TODO" with "DONE".',
            validator: (prev, next) => {
              const text = next.buffer.join('\\n');
              const hasTODO = text.includes('TODO');
              const hasDONE = text.includes('DONE');
              return !hasTODO && hasDONE;
            }
          },
          {
            id: 'cursor-on-start-server-comment',
            type: 'move',
            description: 'Move the cursor onto the comment that mentions "start server".',
            validator: (prev, next) => {
              const { line } = next.cursor;
              if (line < 0 || line >= next.buffer.length) return false;
              return next.buffer[line].includes('start server');
            }
          }
        ]
      }
    }
  ]
};
