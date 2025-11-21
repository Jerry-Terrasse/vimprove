import type { Lesson } from '@/core/types';

export const operatorChangeBasic: Lesson = {
  slug: 'operator-change-basic',
  title: 'Change with c + motion',
  categoryId: 'chapter3',
  shortDescription: 'Use c + motion to delete a range and jump straight into Insert mode.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Change = delete + insert

The **c** operator is like **d**, but with one extra step:

- **d{motion}** – delete a range and stay in Normal mode.
- **c{motion}** – delete a range and enter **Insert mode** at that spot.

Common patterns:

- \`cw\` – change the word under/after the cursor.
- \`c$\` – change from here to the end of the line.
- \`c0\` – change from here back to column 0.

This is perfect for renaming variables or rewriting the rest of a line.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '',
          'int main() {',
          '    int userCount = 0;',
          '    std::cout << "Users: " << userCount << "\\n";',
          '}'
        ],
        initialCursor: { line: 3, col: 8 },
        autoPlaySpeed: 900,
        tracks: [
          { label: 'Change with c + motion', keys: [] }
        ],
        steps: [
          { key: 'c', description: 'c: start the change operator on "userCount".', cursorIndex: 0 },
          { key: 'w', description: 'w: cw – delete the word "userCount" and enter Insert.', cursorIndex: 0 },
          { key: 't', description: 'Type "t".', cursorIndex: 0 },
          { key: 'o', description: 'Type "o".', cursorIndex: 0 },
          { key: 't', description: 'Type "t".', cursorIndex: 0 },
          { key: 'a', description: 'Type "a".', cursorIndex: 0 },
          { key: 'l', description: 'Type "l".', cursorIndex: 0 },
          { key: 'U', description: 'Type "U".', cursorIndex: 0 },
          { key: 's', description: 'Type "s" to complete "totalUs".', cursorIndex: 0 },
          { key: 'e', description: 'Type "e".', cursorIndex: 0 },
          { key: 'r', description: 'Type "r" to finish "totalUser".', cursorIndex: 0 },
          { key: 's', description: 'Type "s" to get "totalUsers".', cursorIndex: 0 },
          { key: 'Escape', description: 'Escape: back to Normal with the new name.', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['c'], desc: 'Change operator (delete range and enter Insert)' },
        { chars: ['w'], desc: 'Use with c to change a word' },
        { chars: ['0'], desc: 'Use with c to change back to column 0' },
        { chars: ['$'], desc: 'Use with c to change to end of line' },
        { chars: ['Esc'], desc: 'Leave Insert mode' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '',
          'int main() {',
          '    int userCount = 0;',
          '    std::cout << "Users: " << userCount << "\\n";',
          '}'
        ],
        initialCursor: { line: 3, col: 4 },
        goalsRequired: 1,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          'w', 'b', 'e',
          '0', '^', '$',
          'c', 'd',
          'i', 'a', 'o', 'O',
          'Escape'
        ],
        goals: [
          {
            id: 'rename-userCount',
            type: 'change',
            description: 'Rename "userCount" to "totalUsers" everywhere in main.',
            validator: (prev, next) => {
              const text = next.buffer.join('\n');
              return text.includes('totalUsers') && !text.includes('userCount');
            }
          }
        ]
      }
    }
  ]
};
