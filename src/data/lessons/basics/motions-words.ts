import type { Lesson } from '@/core/types';

export const motionsWords: Lesson = {
  slug: 'motions-words',
  title: 'Move by words: w, b, e',
  categoryId: 'chapter2',
  shortDescription: 'Jump over whole words instead of moving character by character.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Why move by words?

Using **h** and **l** to move one character at a time is slow.

Vim gives you **word motions** to skip bigger chunks:

- **w** – jump to the **start of the next word**
- **b** – jump **back** to the start of the previous word
- **e** – jump to the **end of the current/next word**

A "word" here is a run of letters, digits, or underscores separated by spaces or punctuation.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          '#include <string>',
          '',
          'int main() {',
          '    std::string fullName = "Ada Lovelace";',
          '}'
        ],
        initialCursor: { line: 3, col: 4 },
        autoPlaySpeed: 900,
        tracks: [
          { label: 'Move by words', keys: [] }
        ],
        steps: [
          { key: 'w', description: 'w: jump from indentation to "std::string".', cursorIndex: 0 },
          { key: 'w', description: 'w: jump to "fullName".', cursorIndex: 0 },
          { key: 'e', description: 'e: jump to the end of "fullName".', cursorIndex: 0 },
          { key: 'b', description: 'b: jump back to the start of "fullName".', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['w'], desc: 'Jump to the start of the next word' },
        { chars: ['b'], desc: 'Jump back to the start of the previous word' },
        { chars: ['e'], desc: 'Jump to the end of the current/next word' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          "let firstName = 'Ada';",
          "let lastName = 'Lovelace';",
          'const fullName = firstName + lastName;'
        ],
        initialCursor: { line: 0, col: 0 },
        goalsRequired: 2,
        enabledCommands: ['h', 'j', 'k', 'l', 'w', 'b', 'e'],
        goals: [
          {
            id: 'reach-lastName-start',
            type: 'move',
            description: 'Move the cursor to the start of the word "lastName" on the second line.',
            validator: (prev, next) => {
              if (next.buffer.length < 2) return false;
              return next.cursor.line === 1 && next.cursor.col === 4;
            }
          },
          {
            id: 'reach-firstName-end',
            type: 'move',
            description: 'Move the cursor to the end of the word "firstName" on the third line.',
            validator: (prev, next) => {
              if (next.buffer.length < 3) return false;
              return next.cursor.line === 2 && next.cursor.col === 25;
            }
          }
        ]
      }
    }
  ]
};
