import type { Lesson } from '@/core/types';

export const textobjectsParagraphs: Lesson = {
  slug: 'textobjects-paragraphs',
  title: 'Paragraph text objects: ip, ap',
  categoryId: 'chapter5',
  shortDescription: 'Treat consecutive non-empty lines as a paragraph and operate on them as one unit.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Paragraphs as text objects

A **paragraph** in Vim is a block of non-empty lines separated by empty lines.

Text objects:

- **ip** – "inner paragraph": just the block of text.
- **ap** – "a paragraph": the block plus one surrounding blank line.

You can combine them with operators:

- **dip** – delete the inner paragraph.
- **yip** – yank the paragraph.
- **cip** – change the paragraph and enter Insert mode.

This is useful for comment blocks and documentation inside code.`
    },

    {
      type: 'run-example',
      config: {
        initialBuffer: [
          '#include <string>',
          '#include <iostream>',
          '',
          'int main() {',
          '    // Description:',
          '    //  This program prints a greeting.',
          '',
          '    std::string name = "Ada";',
          '    std::cout << "Hello, " << name << "\\n";',
          '}'
        ],
        initialCursor: { line: 4, col: 8 }, // on the first "// Description" line
        autoPlaySpeed: 900,
        tracks: [
          { label: 'Delete a whole paragraph with dip', keys: ['d', 'i', 'p'] }
        ],
        steps: [
          { key: 'd', description: 'd: start delete operator on the comment block.', cursorIndex: 0 },
          { key: 'i', description: 'i: choose the inner text object.', cursorIndex: 0 },
          { key: 'p', description: 'p: dip – delete the whole comment paragraph at once.', cursorIndex: 0 }
        ]
      }
    },

    {
      type: 'key-list',
      keys: [
        { chars: ['d', 'i', 'p'], desc: 'Delete the inner paragraph around the cursor' },
        { chars: ['y', 'i', 'p'], desc: 'Yank (copy) the paragraph' },
        { chars: ['c', 'i', 'p'], desc: 'Change the paragraph and enter Insert mode' },
        { chars: ['d', 'a', 'p'], desc: 'Delete the paragraph plus one surrounding blank line' }
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
          '    // Description:',
          '    //  This program prints a greeting.',
          '',
          '    // NOTE:',
          '    //  Logging is disabled in this build.',
          '',
          '    std::string name = "Ada";',
          '    std::cout << "Hello, " << name << "\\n";',
          '}'
        ],
        initialCursor: { line: 4, col: 8 },
        goalsRequired: 2,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          'd', 'c', 'y',
          'i', 'a', 'ip', 'ap',
          'p', 'P',
          'w', 'b', 'e',
          '0', '^', '$',
          '1', '2', '3', '4', '5', '6', '7', '8', '9',
          'Escape'
        ],
        goals: [
          {
            id: 'remove-note-paragraph',
            type: 'delete',
            description: 'Delete the NOTE paragraph (but keep the Description paragraph).',
            validator: (prev, next) => {
              const text = next.buffer.join('\\n');
              return text.includes('Description:') &&
                     !text.includes('NOTE:') &&
                     !text.includes('Logging is disabled');
            }
          },
          {
            id: 'duplicate-description',
            type: 'insert',
            description: 'Make a second copy of the Description paragraph above std::string name.',
            validator: (prev, next) => {
              const lines = next.buffer;
              const descriptionCount = lines.filter(line => line.includes('Description:')).length;
              return descriptionCount >= 2;
            }
          }
        ]
      }
    }
  ]
};
