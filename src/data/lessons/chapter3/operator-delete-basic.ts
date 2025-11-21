import type { Lesson } from '@/core/types';

export const operatorDeleteBasic: Lesson = {
  slug: 'operator-delete-basic',
  title: 'Delete with d + motion',
  categoryId: 'chapter3',
  shortDescription: 'Use d + motion to delete exactly the range you want.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Operator + motion: think "verb + range"

So far you learned motions like **w**, **0**, **$** to move the cursor.

Vim adds **operators** that act on a *range* defined by a motion:

- **d** is "delete".
- \`d + motion\` means "delete from here to where that motion would move".

Examples:

- \`dw\` – delete to the **start of the next word**.
- \`d0\` – delete **back to column 0**.
- \`d$\` – delete **to the end of the line**.

You can read them as little sentences:

- \`dw\` → "delete a word forward".
- \`d0\` → "delete back to the start of this line".
- \`d$\` → "delete to the end of this line".`
    },
    {
      type: 'markdown',
      content: `## Example: deleting a word and a comment

The example jumps onto a variable name and deletes it with \`dw\`,
then moves to a trailing comment and uses \`d$\` to remove everything to the end of the line.
It shows how the delete operator follows whatever motion you pair with it.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '',
          'int main() {',
          '    int debugValue = 42;  // temporary debug',
          '}'
        ],
        initialCursor: { line: 3, col: 4 },
        autoPlaySpeed: 900,
        tracks: [
          { label: 'Delete with d + motion', keys: [] }
        ],
        steps: [
          { key: 'w', description: 'w: jump to "debugValue".', cursorIndex: 0 },
          { key: 'd', description: 'd: start the delete operator.', cursorIndex: 0 },
          { key: 'w', description: 'w: dw – delete the word "debugValue".', cursorIndex: 0 },

          { key: 'w', description: 'w: move to the comment start "//".', cursorIndex: 0 },
          { key: 'd', description: 'd: start another delete.', cursorIndex: 0 },
          { key: '$', description: '$: d$ – delete from here to end of line.', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['d'], desc: 'Delete operator (combine with a motion)' },
        { chars: ['w'], desc: 'Jump to next word start' },
        { chars: ['0'], desc: 'Jump to column 0' },
        { chars: ['^'], desc: 'Jump to first non-blank character' },
        { chars: ['$'], desc: 'Jump to end of line' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '',
          'int main() {',
          '    int value = 42;      // debug value',
          '    int count = 3;       // unused',
          '    std::cout << value << "\\n";',
          '}'
        ],
        initialCursor: { line: 3, col: 4 },
        goalsRequired: 2,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          'w', 'b', 'e',
          '0', '^', '$',
          'd', 'x',
          'i', 'a', 'o', 'O',
          'Escape'
        ],
        goals: [
          {
            id: 'remove-debug-word',
            type: 'delete',
            description: 'Remove the word "debug" from the comment on the value line.',
            validator: (prev, next) => {
              const text = next.buffer.join('\n');
              return !text.includes('debug value') && !text.includes('debug');
            }
          },
          {
            id: 'remove-unused-comment',
            type: 'delete',
            description: 'Remove the entire "// unused" comment on the count line.',
            validator: (prev, next) => {
              if (next.buffer.length < 5) return false;
              const line = next.buffer[4];
              return !line.includes('// unused') && line.includes('int count = 3;');
            }
          }
        ]
      }
    }
  ]
};
