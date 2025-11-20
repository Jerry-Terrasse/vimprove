import type { Lesson } from '@/core/types';

export const changeWithFind: Lesson = {
  slug: 'change-with-find',
  title: 'Change using find motions: c f/t',
  categoryId: 'chapter4',
  shortDescription: 'Use c f/t to rewrite precise slices of text inside a line.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Change up to a character

The **c** operator can also be combined with find/till motions:

- **cf{char}** – change from cursor **through** the next \`{char}\`.
- **ct{char}** – change from cursor **until just before** the next \`{char}\`.

They both:

1. Delete that range.
2. Enter **Insert mode** so you can type a replacement.

Common use cases:

- \`ct"\` – replace the contents of a string until the closing quote.
- \`ct)\` – rewrite arguments until the closing parenthesis (keep the \`) \`).`
    },
    {
      type: 'markdown',
      content: `## Code we will edit

We start from a simple C++ string:

\`\`\`cpp
#include <string>

int main() {
    std::string name = "Ada";
}
\`\`\`

We will use **ct"** to replace \`"Ada"\` with a new name, without touching the quotes.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          '#include <string>',
          '',
          'int main() {',
          '    std::string name = "Ada";',
          '}'
        ],
        // on 'A' in "Ada"
        initialCursor: { line: 3, col: 26 },
        autoPlaySpeed: 850,
        tracks: [
          { label: 'Change with c t"', keys: ['c', 't', '"', 'B', 'o', 'b', 'Escape'] }
        ],
        steps: [
          { key: 'c', description: 'c: start the change operator inside the string.', cursorIndex: 0 },
          { key: 't', description: 't: choose a till motion (stop before a character).', cursorIndex: 0 },
          { key: '"', description: '"ct\\"": delete up to but not including the closing quote and enter Insert.', cursorIndex: 0 },
          { key: 'B', description: 'Type "B".', cursorIndex: 0 },
          { key: 'o', description: 'Type "o".', cursorIndex: 0 },
          { key: 'b', description: 'Type "b" to make the new value "Bob".', cursorIndex: 0 },
          { key: 'Escape', description: 'Escape: finish the change and return to Normal mode.', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['c', 't', '"'], desc: 'Change inside the string until just before the closing quote' },
        { chars: ['c', 't', ')'], desc: 'Change up to but not including the closing parenthesis' },
        { chars: ['c', 'f', '"'], desc: 'Change through the closing quote (include it in the change)' }
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
          '    std::string greeting = "Hello";',
          '    std::string name = "Ada";',
          '    std::cout << greeting << ", " << name << "!\\n";',
          '}'
        ],
        initialCursor: { line: 4, col: 4 },
        goalsRequired: 2,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          '0', '$',
          'f', 't',
          'c',
          'Escape'
        ],
        goals: [
          {
            id: 'change-greeting',
            type: 'change',
            description: 'Change the greeting string to "Hi".',
            validator: (prev, next) => {
              const line = next.buffer.find(l => l.includes('greeting'));
              if (!line) return false;
              return line.includes('"Hi"');
            }
          },
          {
            id: 'change-name',
            type: 'change',
            description: 'Change the name string to "Ada Lovelace".',
            validator: (prev, next) => {
              const line = next.buffer.find(l => l.includes('name'));
              if (!line) return false;
              return line.includes('"Ada Lovelace"');
            }
          }
        ]
      }
    }
  ]
};
