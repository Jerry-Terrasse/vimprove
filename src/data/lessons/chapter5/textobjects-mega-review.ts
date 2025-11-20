import type { Lesson } from '@/core/types';

export const textobjectsMegaReview: Lesson = {
  slug: 'textobjects-mega-review',
  title: 'Text objects mega review',
  categoryId: 'chapter5',
  shortDescription: 'Combine word, bracket, and quote text objects to refactor a small C++ snippet.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Text objects: the big picture

You now know several text objects:

- **iw/aw** – words.
- **ip/ap** – paragraphs.
- **i(/a(**, **i{/a{**, **i[/a[** – brackets.
- **i"/a"** – strings.

Combined with operators, they become small sentences:

- **ciw** – change this word.
- **di(** – delete inside these parentheses.
- **ci"** – rewrite this string.
- **dip** – delete this whole comment block.

In this review, you will use them together to clean up a small program.`
    },

    {
      type: 'run-example',
      config: {
        initialBuffer: [
          '#include <string>',
          '#include <iostream>',
          '',
          'void logError(const std::string& message) {',
          '    std::cout << "[ERROR] " << message << "\\n";',
          '}',
          '',
          'int main() {',
          '    std::string name = "Ada";',
          '    if (name.empty()) {',
          '        logError("Name is empty");',
          '    }',
          '}'
        ],
        initialCursor: { line: 10, col: 8 }, // inside if-block, on the logError call
        autoPlaySpeed: 900,
        tracks: [
          { label: 'Combine ci" and di{', keys: ['f', '"', 'l', 'c', 'i', '"', 'I', 'n', 'v', 'a', 'l', 'i', 'd', ' ', 'n', 'a', 'm', 'e', 'Escape', 'k', 'f', '{', 'j', 'd', 'i', '{'] }
        ],
        steps: [
          // Change the error message string
          { key: 'f', description: 'f: find the double quote in the logError call.', cursorIndex: 0 },
          { key: '"', description: 'Target "\\"": jump to the start of the string.', cursorIndex: 0 },
          { key: 'l', description: 'l: move inside the string.', cursorIndex: 0 },
          { key: 'c', description: 'c: start a change on the string content.', cursorIndex: 0 },
          { key: 'i', description: 'i: choose inner double-quote text object.', cursorIndex: 0 },
          { key: '"', description: '"ci\\"": delete "Name is empty" and enter Insert.', cursorIndex: 0 },
          { key: 'I', description: 'Type "I".', cursorIndex: 0 },
          { key: 'n', description: 'Type "n".', cursorIndex: 0 },
          { key: 'v', description: 'Type "v".', cursorIndex: 0 },
          { key: 'a', description: 'Type "a".', cursorIndex: 0 },
          { key: 'l', description: 'Type "l".', cursorIndex: 0 },
          { key: 'i', description: 'Type "i".', cursorIndex: 0 },
          { key: 'd', description: 'Type "d" to start "Invalid name".', cursorIndex: 0 },
          { key: ' ', description: 'Type space.', cursorIndex: 0 },
          { key: 'n', description: 'Type "n".', cursorIndex: 0 },
          { key: 'a', description: 'Type "a".', cursorIndex: 0 },
          { key: 'm', description: 'Type "m".', cursorIndex: 0 },
          { key: 'e', description: 'Type "e" to complete "Invalid name".', cursorIndex: 0 },
          { key: 'Escape', description: 'Escape: finish the string change.', cursorIndex: 0 },

          // Clear the if-block body (for example, to rewrite it)
          { key: 'k', description: 'k: move up to the if-line with the opening brace.', cursorIndex: 0 },
          { key: 'f', description: 'f: find the opening "{".', cursorIndex: 0 },
          { key: '{', description: 'Target "{": jump to the brace.', cursorIndex: 0 },
          { key: 'j', description: 'j: move inside the block.', cursorIndex: 0 },
          { key: 'd', description: 'd: start delete operator.', cursorIndex: 0 },
          { key: 'i', description: 'i: choose inner-brace text object.', cursorIndex: 0 },
          { key: '{', description: '"di{": delete everything inside the if-block.', cursorIndex: 0 }
        ]
      }
    },

    {
      type: 'key-list',
      keys: [
        { chars: ['c', 'i', 'w'], desc: 'Change the inner word' },
        { chars: ['c', 'i', '"'], desc: 'Change the inside of a string' },
        { chars: ['d', 'i', '('], desc: 'Delete inside parentheses' },
        { chars: ['d', 'i', '{'], desc: 'Delete inside braces' },
        { chars: ['d', 'i', 'p'], desc: 'Delete inner paragraph' }
      ]
    },

    {
      type: 'challenge',
      config: {
        initialBuffer: [
          '#include <string>',
          '#include <iostream>',
          '',
          'void logMessage(const std::string& prefix, const std::string& text) {',
          '    std::cout << prefix << ": " << text << "\\n";',
          '}',
          '',
          'int main() {',
          '    std::string userName = "Ada";',
          '    std::string greeting = "Hello";',
          '    if (userName.empty()) {',
          '        logMessage("ERROR", "userName is empty");',
          '    } else {',
          '        logMessage("INFO", greeting + ", " + userName);',
          '    }',
          '}'
        ],
        initialCursor: { line: 8, col: 4 },
        goalsRequired: 3,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          'w', 'b', 'e', 'W', 'B', 'E',
          '0', '^', '$',
          'f', 'F', 't', 'T', ';', ',',
          'd', 'c', 'y', 'p', 'P',
          'i', 'a', 'iw', 'aw', 'i(', 'a(', 'i{', 'a{', 'i"', 'a"', 'ip', 'ap',
          '1', '2', '3', '4', '5', '6', '7', '8', '9',
          '.', 'u', 'Ctrl-r',
          'Escape'
        ],
        goals: [
          {
            id: 'rename-userName-to-name',
            type: 'change',
            description: 'Rename "userName" to "name" everywhere.',
            validator: (prev, next) => {
              const text = next.buffer.join('\\n');
              return text.includes('name') &&
                     !text.includes('userName');
            }
          },
          {
            id: 'change-greeting-to-hi',
            type: 'change',
            description: 'Change the greeting string to "Hi".',
            validator: (prev, next) => {
              const text = next.buffer.join('\\n');
              return text.includes('std::string greeting = "Hi";') &&
                     !text.includes('std::string greeting = "Hello";');
            }
          },
          {
            id: 'update-error-call',
            type: 'change',
            description: 'In the if-branch, change the logMessage call to use "FATAL" and "name is empty".',
            validator: (prev, next) => {
              const text = next.buffer.join('\\n');
              return text.includes('logMessage("FATAL", "name is empty");') &&
                     !text.includes('logMessage("ERROR", "userName is empty");');
            }
          }
        ]
      }
    }
  ]
};
