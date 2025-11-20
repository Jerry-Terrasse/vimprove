import type { Lesson } from '@/core/types';

export const realworldCleanup1: Lesson = {
  slug: 'realworld-cleanup-1',
  title: 'Real-world cleanup: remove debug noise',
  categoryId: 'chapter6',
  shortDescription: 'Use search, operators, and repeat to clean up a noisy main function.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Clean up noisy code with search

In real projects you often need to:

- Remove temporary debug blocks.
- Fix a wrong constant used many times.
- Update a status message.

Instead of scrolling and editing by hand, you can:

- **/pattern** to jump to each place.
- Use **d** or **c** with motions or text objects.
- Use **.** to repeat fixes.
- Use **u** / **Ctrl-r** to correct mistakes.`
    },
    {
      type: 'markdown',
      content: `## Playable example: remove one debug line

We start from:

\`\`\`cpp
#include <iostream>

int main() {
    int value = 42;
    // DEBUG: temporary log
    std::cout << "Value = " << value << std::endl;
}
\`\`\`

Goal: remove the debug comment line with a search and a single delete command.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '',
          'int main() {',
          '    int value = 42;',
          '    // DEBUG: temporary log',
          '    std::cout << "Value = " << value << std::endl;',
          '}'
        ],
        initialCursor: { line: 2, col: 0 },
        autoPlaySpeed: 900,
        tracks: [
          { label: 'Search and delete a debug line', keys: ['/', 'D', 'E', 'B', 'U', 'G', 'Enter', 'd', 'd'] }
        ],
        steps: [
          { key: '/', description: '/: start a forward search.', cursorIndex: 0 },
          { key: 'D', description: 'Type "D".', cursorIndex: 0 },
          { key: 'E', description: 'Type "E".', cursorIndex: 0 },
          { key: 'B', description: 'Type "B".', cursorIndex: 0 },
          { key: 'U', description: 'Type "U".', cursorIndex: 0 },
          { key: 'G', description: 'Type "G".', cursorIndex: 0 },
          { key: 'Enter', description: 'Enter: jump to the match "DEBUG".', cursorIndex: 0 },
          { key: 'd', description: 'd: first d of dd – delete the whole line.', cursorIndex: 0 },
          { key: 'd', description: 'd: second d – the debug comment line is removed.', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['/', 'pattern'], desc: 'Search forward for a pattern' },
        { chars: ['n'], desc: 'Jump to the next match' },
        { chars: ['d', 'd'], desc: 'Delete the current line' },
        { chars: ['.'], desc: 'Repeat the last change' },
        { chars: ['u'], desc: 'Undo the last change' },
        { chars: ['Ctrl-r'], desc: 'Redo the last undone change' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          '#include <string>',
          '#include <iostream>',
          '',
          'int main() {',
          '    bool debug = true;',
          '    int port = 8080;',
          '    std::string host = "localhost";',
          '    if (debug) {',
          '        std::cout << "[DEBUG] starting on " << host << ":" << port << "\\n";',
          '    }',
          '    std::cout << "[INFO] ready" << "\\n";',
          '}'
        ],
        initialCursor: { line: 3, col: 0 },
        goalsRequired: 3,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          'w', 'b', 'e', 'W', 'B', 'E',
          '0', '^', '$',
          '/', '?', 'n', 'N', '*', '#',
          'd', 'c', 'y', 'x',
          'i', 'a', 'I', 'A', 'o', 'O',
          'iw', 'aw', 'i(', 'i{', 'i"', 'a(', 'a{', 'a"',
          '.',
          'u', 'Ctrl-r',
          '1', '2', '3', '4', '5', '6', '7', '8', '9',
          'Escape',
          'Backspace', 'Enter'
        ],
        goals: [
          {
            id: 'remove-debug-block',
            type: 'delete',
            description: 'Remove the debug-only if (debug) block and its log line.',
            validator: (prev, next) => {
              const text = next.buffer.join('\\n');
              const hasIfDebug = text.includes('if (debug)');
              const hasDebugLog = text.includes('[DEBUG]');
              return !hasIfDebug && !hasDebugLog;
            }
          },
          {
            id: 'change-port-to-80',
            type: 'change',
            description: 'Change the port so that it is initialized to 80 instead of 8080.',
            validator: (prev, next) => {
              const text = next.buffer.join('\\n');
              return text.includes('int port = 80;') && !text.includes('int port = 8080;');
            }
          },
          {
            id: 'improve-info-message',
            type: 'change',
            description: 'Update the info message so it reads "[INFO] server ready".',
            validator: (prev, next) => {
              const text = next.buffer.join('\\n');
              return text.includes('"[INFO] server ready"') && !text.includes('"[INFO] ready"');
            }
          }
        ]
      }
    }
  ]
};
