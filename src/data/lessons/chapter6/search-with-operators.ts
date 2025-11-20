import type { Lesson } from '@/core/types';

export const searchWithOperators: Lesson = {
  slug: 'search-with-operators',
  title: 'Search + operators: refactor quickly',
  categoryId: 'chapter6',
  shortDescription: 'Use search to find matches, then combine with operators and dot-repeat.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Search first, then operate

Search is powerful when combined with **operators**:

1. Use **/**, **?**, or *** to jump to the first match.
2. Use an operator + motion or text object:
   - \`ciw\` – change the whole word.
   - \`ci"\` – change inside a string.
3. Use **n** to move to the next match.
4. Use **.** to repeat the last change.

This lets you refactor many similar places with just a few key presses.`
    },
    {
      type: 'markdown',
      content: `## Playable example: change DEBUG to INFO

We start with:

\`\`\`cpp
#include <string>

int main() {
    std::string level = "DEBUG";
    std::string other = "DEBUG";
}
\`\`\`

Imagine you used **/DEBUG** to land on the first "DEBUG".  
Now you can:

- Use **ci"** to change the string to "INFO".
- Move to the second "DEBUG".
- Press **.** to repeat the change.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          '#include <string>',
          '',
          'int main() {',
          '    std::string level = "DEBUG";',
          '    std::string other = "DEBUG";',
          '}'
        ],
        // On the D in the first "DEBUG"
        initialCursor: { line: 3, col: 25 },
        autoPlaySpeed: 900,
        tracks: [
          { label: 'ci" + dot repeat', keys: ['c', 'i', '"', 'I', 'N', 'F', 'O', 'Escape', 'j', '.'] }
        ],
        steps: [
          { key: 'c', description: 'c: start a change on the string content.', cursorIndex: 0 },
          { key: 'i', description: 'i: choose the inner double-quote text object.', cursorIndex: 0 },
          { key: '"', description: '": ci\\" deletes "DEBUG" and enters Insert mode.', cursorIndex: 0 },
          { key: 'I', description: 'Type "I".', cursorIndex: 0 },
          { key: 'N', description: 'Type "N".', cursorIndex: 0 },
          { key: 'F', description: 'Type "F".', cursorIndex: 0 },
          { key: 'O', description: 'Type "O".', cursorIndex: 0 },
          { key: 'Escape', description: 'Escape: finish editing, string is now "INFO".', cursorIndex: 0 },
          { key: 'j', description: 'j: move down to the second "DEBUG".', cursorIndex: 0 },
          { key: '.', description: '.: repeat the last change, turning it into "INFO" as well.', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['/', 'pattern'], desc: 'Search for a pattern' },
        { chars: ['n'], desc: 'Jump to next match' },
        { chars: ['*'], desc: 'Search word under cursor' },
        { chars: ['c', 'i', '"'], desc: 'Change inside a string and enter Insert' },
        { chars: ['.'], desc: 'Repeat the last change' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          '#include <string>',
          '#include <iostream>',
          '',
          'void logDebug(const std::string& msg) {',
          '    std::cout << "[DEBUG] " << msg << "\\n";',
          '}',
          '',
          'int main() {',
          '    logDebug("Starting up");',
          '    logDebug("Listening on port 8080");',
          '}'
        ],
        initialCursor: { line: 3, col: 0 },
        goalsRequired: 2,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          'w', 'b', 'e',
          '0', '^', '$',
          '/', '?', 'n', 'N', '*', '#',
          'd', 'c', 'y', 'x',
          'i', 'a', 'I', 'A', 'o', 'O',
          '.',
          'u', 'Ctrl-r',
          '1', '2', '3', '4', '5', '6', '7', '8', '9',
          'Escape',
          'Backspace', 'Enter'
        ],
        goals: [
          {
            id: 'rename-logdebug-to-loginfo',
            type: 'change',
            description: 'Rename the function and all calls from logDebug to logInfo.',
            validator: (prev, next) => {
              const text = next.buffer.join('\\n');
              const hasOld = text.includes('logDebug');
              const hasNew = text.includes('logInfo');
              return !hasOld && hasNew;
            }
          },
          {
            id: 'change-debug-prefix-to-info',
            type: 'change',
            description: 'Change the log prefix from "[DEBUG]" to "[INFO]".',
            validator: (prev, next) => {
              const text = next.buffer.join('\\n');
              return text.includes('"[INFO] "') && !text.includes('"[DEBUG] "');
            }
          }
        ]
      }
    }
  ]
};
