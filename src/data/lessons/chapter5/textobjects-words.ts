import type { Lesson } from '@/core/types';

export const textobjectsWords: Lesson = {
  slug: 'textobjects-words',
  title: 'Word text objects: iw, aw',
  categoryId: 'chapter5',
  shortDescription: 'Use iw and aw to select whole words instead of guessing motions.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Text objects: operator + i/a + object

So far you combined operators with motions:

- \`d + w\` → delete to the next word.
- \`c + $\` → change to the end of the line.

**Text objects** add a new pattern:

> **operator + i/a + object**

Here:

- **i** = "inner"
- **a** = "a... including surrounding space or delimiter"
- **w** = "word"

So you get:

- **diw** – delete inner word (just the word).
- **daw** – delete a word and its surrounding space.
- **ciw** – change the whole word and enter Insert mode.
- **yiw** – yank (copy) the word.`
    },

    {
      type: 'run-example',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '',
          'int main() {',
          '    int totalCount = 42;',
          '    int maxCount = 100;',
          '}'
        ],
        initialCursor: { line: 3, col: 8 }, // on "t" of "totalCount"
        autoPlaySpeed: 900,
        tracks: [
          { label: 'Rename with ciw', keys: ['c', 'i', 'w', 'i', 't', 'e', 'm', 'C', 'o', 'u', 'n', 't', 'Escape'] }
        ],
        steps: [
          { key: 'c', description: 'c: start a change on the current word.', cursorIndex: 0 },
          { key: 'i', description: 'i: choose the inner word text object.', cursorIndex: 0 },
          { key: 'w', description: 'w: ciw – delete the whole word and enter Insert mode.', cursorIndex: 0 },

          { key: 'i', description: 'Type "i".', cursorIndex: 0 },
          { key: 't', description: 'Type "t".', cursorIndex: 0 },
          { key: 'e', description: 'Type "e".', cursorIndex: 0 },
          { key: 'm', description: 'Type "m".', cursorIndex: 0 },
          { key: 'C', description: 'Type "C".', cursorIndex: 0 },
          { key: 'o', description: 'Type "o".', cursorIndex: 0 },
          { key: 'u', description: 'Type "u".', cursorIndex: 0 },
          { key: 'n', description: 'Type "n".', cursorIndex: 0 },
          { key: 't', description: 'Type "t" to complete "itemCount".', cursorIndex: 0 },
          { key: 'Escape', description: 'Escape: finish the rename and return to Normal.', cursorIndex: 0 }
        ]
      }
    },

    {
      type: 'key-list',
      keys: [
        { chars: ['d', 'i', 'w'], desc: 'Delete the inner word under the cursor' },
        { chars: ['d', 'a', 'w'], desc: 'Delete the word plus surrounding space or punctuation' },
        { chars: ['c', 'i', 'w'], desc: 'Change the inner word and enter Insert mode' },
        { chars: ['y', 'i', 'w'], desc: 'Yank (copy) the inner word' }
      ]
    },

    {
      type: 'challenge',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '',
          'int main() {',
          '    int oldValue = 1;',
          '    int oldCount = 2;',
          '    std::cout << oldValue + oldCount << "\\n";',
          '}'
        ],
        initialCursor: { line: 3, col: 4 },
        goalsRequired: 2,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          'w', 'b', 'e',
          '0', '^', '$',
          'd', 'c', 'y',
          'i', 'a', 'iw', 'aw',
          '1', '2', '3', '4', '5', '6', '7', '8', '9',
          'p', 'P',
          'Escape'
        ],
        goals: [
          {
            id: 'rename-oldValue',
            type: 'change',
            description: 'Rename "oldValue" to "newValue" everywhere.',
            validator: (prev, next) => {
              const text = next.buffer.join('\\n');
              return text.includes('newValue') &&
                     !text.includes('oldValue');
            }
          },
          {
            id: 'rename-oldCount',
            type: 'change',
            description: 'Rename "oldCount" to "newCount" everywhere.',
            validator: (prev, next) => {
              const text = next.buffer.join('\\n');
              return text.includes('newCount') &&
                     !text.includes('oldCount');
            }
          }
        ]
      }
    }
  ]
};
