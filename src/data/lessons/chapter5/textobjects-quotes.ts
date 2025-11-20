import type { Lesson } from '@/core/types';

export const textobjectsQuotes: Lesson = {
  slug: 'textobjects-quotes',
  title: 'Quote text objects: strings',
  categoryId: 'chapter5',
  shortDescription: 'Edit the inside of strings cleanly with ci", di", and friends.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Quote text objects

Strings are everywhere in code. Text objects let you edit them without counting characters.

For quotes:

- **i"** / **a"** – inner / around double-quoted string.
- **i'** / **a'** – inner / around single-quoted string.
- **i\`** / **a\`** – inner / around backtick string (in other languages).

Combined with operators:

- **ci"** – change the contents of the string, keep the quotes.
- **di"** – delete the contents of the string, keep the quotes.
- **yi"** – yank the contents of the string.`
    },

    {
      type: 'run-example',
      config: {
        initialBuffer: [
          '#include <string>',
          '',
          'int main() {',
          '    std::string message = "Hello, world";',
          '}'
        ],
        initialCursor: { line: 3, col: 4 },
        autoPlaySpeed: 900,
        tracks: [
          { label: 'Change string with ci"', keys: ['f', '"', 'l', 'c', 'i', '"', 'H', 'i', '!', 'Escape'] }
        ],
        steps: [
          { key: 'f', description: 'f: find the opening double quote.', cursorIndex: 0 },
          { key: '"', description: 'Target "\\"": jump to the start of the string.', cursorIndex: 0 },
          { key: 'l', description: 'l: move inside the string.', cursorIndex: 0 },
          { key: 'c', description: 'c: start a change.', cursorIndex: 0 },
          { key: 'i', description: 'i: choose inner double-quote text object.', cursorIndex: 0 },
          { key: '"', description: '"ci\\"": delete "Hello, world" and enter Insert.', cursorIndex: 0 },

          { key: 'H', description: 'Type "H".', cursorIndex: 0 },
          { key: 'i', description: 'Type "i".', cursorIndex: 0 },
          { key: '!', description: 'Type "!" to make "Hi!".', cursorIndex: 0 },
          { key: 'Escape', description: 'Escape: finish the change and return to Normal.', cursorIndex: 0 }
        ]
      }
    },

    {
      type: 'key-list',
      keys: [
        { chars: ['c', 'i', '"'], desc: 'Change the inside of a double-quoted string' },
        { chars: ['d', 'i', '"'], desc: 'Delete the inside of a double-quoted string' },
        { chars: ['y', 'i', '"'], desc: 'Yank the inside of a double-quoted string' }
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
          '    std::string level = "INFO";',
          '    std::string message = "Starting up";',
          '    std::cout << "[" << level << "] " << message << "\\n";',
          '}'
        ],
        initialCursor: { line: 4, col: 4 },
        goalsRequired: 2,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          'w', 'b', 'e',
          '0', '^', '$',
          'c', 'd', 'y',
          'i', 'a', 'i"', 'a"',
          '1', '2', '3', '4', '5', '6', '7', '8', '9',
          'Escape'
        ],
        goals: [
          {
            id: 'change-level-to-debug',
            type: 'change',
            description: 'Change the level string so it becomes "DEBUG".',
            validator: (prev, next) => {
              const text = next.buffer.join('\\n');
              return text.includes('std::string level = "DEBUG";') &&
                     !text.includes('std::string level = "INFO";');
            }
          },
          {
            id: 'change-message-to-shutdown',
            type: 'change',
            description: 'Change the message string so it becomes "Shutting down".',
            validator: (prev, next) => {
              const text = next.buffer.join('\\n');
              return text.includes('std::string message = "Shutting down";') &&
                     !text.includes('std::string message = "Starting up";');
            }
          }
        ]
      }
    }
  ]
};
