import type { Lesson } from '@/core/types';

export const operatorYankBasic: Lesson = {
  slug: 'operator-yank-basic',
  title: 'Copy with y + motion, paste with p/P',
  categoryId: 'chapter3',
  shortDescription: 'Use y + motion to yank text and p/P to paste it where you need.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Yank is "copy" in Vim

The **y** operator copies text into a register without deleting it.

- **y{motion}** – yank (copy) the range described by the motion.
- **yy** – yank the whole current line.
- **p** – paste **after** the cursor (or below the current line for a yanked line).
- **P** – paste **before** the cursor (or above the current line for a yanked line).

Think:

- \`yw\` → "copy a word".
- \`y$\` → "copy from here to end of line".
- \`yy\` → "copy this line".`
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
          '    std::string copy = "";',
          '    std::cout << name << "\\n";',
          '}'
        ],
        initialCursor: { line: 4, col: 4 },
        autoPlaySpeed: 900,
        tracks: [
          { label: 'Yank + paste', keys: [] }
        ],
        steps: [
          { key: 'w', description: 'w: jump to "name".', cursorIndex: 0 },
          { key: 'w', description: 'w: jump to the string literal "\"Ada\"".', cursorIndex: 0 },
          { key: 'y', description: 'y: start the yank operator on the string.', cursorIndex: 0 },
          { key: 'w', description: 'w: yw – yank the word "\"Ada\"".', cursorIndex: 0 },

          { key: 'j', description: 'j: move down to the "copy" line.', cursorIndex: 0 },
          { key: '$', description: '$: jump to the end of the line (after ";").', cursorIndex: 0 },
          { key: 'h', description: 'h: move left onto the empty string "".', cursorIndex: 0 },
          { key: 'd', description: 'd: start delete.', cursorIndex: 0 },
          { key: 'w', description: 'w: dw – delete the empty string literal.', cursorIndex: 0 },
          { key: 'p', description: 'p: paste the yanked "\"Ada\"" after the cursor.', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['y'], desc: 'Yank (copy) operator' },
        { chars: ['p'], desc: 'Paste after the cursor / below the line' },
        { chars: ['P'], desc: 'Paste before the cursor / above the line' },
        { chars: ['yy'], desc: 'Yank the whole current line' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '#include <string>',
          '',
          'int main() {',
          '    std::string name = "Ada";',
          '    std::string copy = "";',
          '    std::cout << name << "\\n";',
          '}'
        ],
        initialCursor: { line: 4, col: 4 },
        goalsRequired: 2,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          'w', 'b', 'e',
          '0', '^', '$',
          'd', 'y', 'p', 'P',
          'i', 'a', 'o', 'O',
          'Escape'
        ],
        goals: [
          {
            id: 'copy-name-into-copy',
            type: 'change',
            description: 'Make the "copy" variable store the same string as "name".',
            validator: (prev, next) => {
              if (next.buffer.length < 6) return false;
              const nameLine = next.buffer[4].trim();
              const copyLine = next.buffer[5].trim();
              const nameMatch = nameLine.match(/"([^"]*)"/);
              const copyMatch = copyLine.match(/"([^"]*)"/);
              if (!nameMatch || !copyMatch) return false;
              return nameMatch[1] === copyMatch[1] && copyMatch[1].length > 0;
            }
          },
          {
            id: 'duplicate-log-line',
            type: 'insert',
            description: 'Create a second std::cout line that prints "copy" instead of "name".',
            validator: (prev, next) => {
              const text = next.buffer.join('\n');
              return text.includes('std::cout << copy << "\\n";');
            }
          }
        ]
      }
    }
  ]
};
