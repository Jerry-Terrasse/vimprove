import type { Lesson } from '@/core/types';

export const inLinePrecisionReview: Lesson = {
  slug: 'in-line-precision-review',
  title: 'Mini review: precise in-line edits',
  categoryId: 'chapter4',
  shortDescription: 'Combine f/F/t/T with d and c to surgically edit function calls and strings.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Precise surgery inside a line

You now have:

- **f/F** – jump *on* a character.
- **t/T** – jump *just before/after* a character.
- **; / ,** – repeat the last in-line search.
- **d{motion}** – delete a range.
- **c{motion}** – delete a range and enter Insert mode.

Together they let you do surgical edits like:

- Remove one parameter from a long function call.
- Rewrite a string message without touching quotes.
- Trim or extend initializer lists.`
    },
    {
      type: 'markdown',
      content: `## Code we will edit

We start from this C++ snippet:

\`\`\`cpp
#include <iostream>

int main() {
    auto sum = add(10, 20, 30);
}
\`\`\`

We will:

- Use **dt,** to remove the first argument \`10,\`.
- Then use **ct)** to rewrite the remaining arguments.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '',
          'int main() {',
          '    auto sum = add(10, 20, 30);',
          '}'
        ],
        // on 'a' of "add"
        initialCursor: { line: 3, col: 15 },
        autoPlaySpeed: 900,
        tracks: [
          { label: 'Precise in-line edits', keys: ['f', '(', 'd', 't', ',', 'f', ')', 'c', 't', ')', '4', '2', 'Escape'] }
        ],
        steps: [
          { key: 'f', description: 'f: move forward inside the call.', cursorIndex: 0 },
          { key: '(', description: '"f(" jumps to the opening parenthesis.', cursorIndex: 0 },

          { key: 'd', description: 'd: start delete to remove the first argument.', cursorIndex: 0 },
          { key: 't', description: 't: till motion (stop before a character).', cursorIndex: 0 },
          { key: ',', description: '"dt," deletes "10," but keeps the comma after the remaining arguments.', cursorIndex: 0 },

          { key: 'f', description: 'f: move again towards the end of the argument list.', cursorIndex: 0 },
          { key: ')', description: '"f)" jumps to the closing parenthesis.', cursorIndex: 0 },

          { key: 'c', description: 'c: start a change to rewrite the remaining arguments.', cursorIndex: 0 },
          { key: 't', description: 't: "ct)" will change up to but not including ")".', cursorIndex: 0 },
          { key: ')', description: '"ct)" deletes the current arguments and enters Insert mode.', cursorIndex: 0 },
          { key: '4', description: 'Type "4".', cursorIndex: 0 },
          { key: '2', description: 'Type "2" to make a single argument 42.', cursorIndex: 0 },
          { key: 'Escape', description: 'Escape: finish the change with add(42).', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['f', '('], desc: 'Jump to the next "(" in the line' },
        { chars: ['t', ','], desc: 'Move just before the next comma' },
        { chars: ['d', 't', ','], desc: 'Delete until (but not including) the next comma' },
        { chars: ['c', 't', ')'], desc: 'Change until (but not including) the closing parenthesis' },
        { chars: [';'], desc: 'Repeat last in-line search forward' },
        { chars: [','], desc: 'Repeat last in-line search backward' }
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
          '    auto sum = add(10, 20, 30);           // remove and rewrite args',
          '    std::string message = "DEBUG: x=10, y=20";',
          '    std::cout << message << "\\n";',
          '}'
        ],
        initialCursor: { line: 4, col: 4 },
        goalsRequired: 3,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          '0', '$',
          'f', 'F', 't', 'T', ';', ',',
          'd', 'c',
          'i', 'a',
          'Escape'
        ],
        goals: [
          {
            id: 'simplify-add-call',
            type: 'change',
            description: 'Change the add(...) call so it only has a single argument 42: add(42).',
            validator: (prev, next) => {
              if (next.buffer.length < 5) return false;
              const line = next.buffer[4];
              const trimmed = line.trim();
              return trimmed.includes('add(42);');
            }
          },
          {
            id: 'update-message',
            type: 'change',
            description: 'Update the message string to say "INFO: done" (inside the quotes).',
            validator: (prev, next) => {
              if (next.buffer.length < 6) return false;
              const line = next.buffer[5];
              return line.includes('"INFO: done"');
            }
          },
          {
            id: 'keep-structure',
            type: 'custom',
            description: 'Make sure the std::cout line still prints message followed by "\\n".',
            validator: (prev, next) => {
              const coutLine = next.buffer.find(l => l.includes('std::cout'));
              if (!coutLine) return false;
              return coutLine.includes('message') && coutLine.includes('"\\n"');
            }
          }
        ]
      }
    }
  ]
};
