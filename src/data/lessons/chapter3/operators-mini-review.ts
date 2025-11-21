import type { Lesson } from '@/core/types';

export const operatorsMiniReview: Lesson = {
  slug: 'operators-mini-review',
  title: 'Mini review: operators + motions',
  categoryId: 'chapter3',
  shortDescription: 'Combine d, c, y with motions, counts, and repeat to clean up a small program.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Vim's sentence: operator + motion

By now you know:

- Motions: **w, b, e, 0, ^, $** and friends.
- Operators: **d** (delete), **c** (change), **y** (yank/copy).
- Extras: counts, **.** repeat, **u** undo, **Ctrl-r** redo, **p/P** paste.

The mental model:

> **Action** = operator + motion
> > \`d\` + \`w\` → delete a word
> > \`c\` + \`$\` → change to end of line
> > \`y\` + \`0\` → copy back to start of line

In this review you will:

- Remove a debug line,
- Rename a variable,
- Duplicate and adjust a line,

using any combination of these tools.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '',
          'int main() {',
          '    int count = 3;           // will rename',
          '    int total = 0;',
          '    int debugValue = 42;     // remove this line',
          '    total = count * 2;       // duplicate and edit',
          '    std::cout << total << "\\n";',
          '}'
        ],
        initialCursor: { line: 3, col: 4 },
        autoPlaySpeed: 900,
        tracks: [
          { label: 'Operator mini workflow', keys: [] }
        ],
        steps: [
          { key: 'w', description: 'w: jump to "int".', cursorIndex: 0 },
          { key: 'w', description: 'w: jump to "count".', cursorIndex: 0 },
          { key: 'c', description: 'c: start change on the variable name.', cursorIndex: 0 },
          { key: 'w', description: 'w: cw – delete "count" and enter Insert.', cursorIndex: 0 },
          { key: 'i', description: 'Type "i".', cursorIndex: 0 },
          { key: 't', description: 'Type "t".', cursorIndex: 0 },
          { key: 'e', description: 'Type "e".', cursorIndex: 0 },
          { key: 'm', description: 'Type "m".', cursorIndex: 0 },
          { key: 's', description: 'Type "s" to make "items".', cursorIndex: 0 },
          { key: 'Escape', description: 'Escape: back to Normal with renamed variable.', cursorIndex: 0 },

          { key: 'j', description: 'j: move down to the debugValue line.', cursorIndex: 0 },
          { key: 'd', description: 'd: first d for dd – delete line.', cursorIndex: 0 },
          { key: 'd', description: 'd: second d – whole debug line is gone.', cursorIndex: 0 },

          { key: 'k', description: 'k: move back to "total = items * 2;" line.', cursorIndex: 0 },
          { key: 'y', description: 'y: first y for yy – yank the whole line.', cursorIndex: 0 },
          { key: 'y', description: 'y: second y – the line is copied.', cursorIndex: 0 },
          { key: 'p', description: 'p: paste the copied line below.', cursorIndex: 0 },

          { key: 'j', description: 'j: move to the new pasted line.', cursorIndex: 0 },
          { key: '0', description: '0: jump to start of the line.', cursorIndex: 0 },
          { key: 'w', description: 'w: jump to "total".', cursorIndex: 0 },
          { key: 'w', description: 'w: jump to "items".', cursorIndex: 0 },
          { key: 'w', description: 'w: jump to the multiplier "2;".', cursorIndex: 0 },
          { key: 'c', description: 'c: start changing the multiplier.', cursorIndex: 0 },
          { key: 'w', description: 'w: cw – delete "2;".', cursorIndex: 0 },
          { key: '3', description: 'Type "3".', cursorIndex: 0 },
          { key: ';', description: 'Type ";" to finish "3;".', cursorIndex: 0 },
          { key: 'Escape', description: 'Escape: back to Normal – new line uses 3.', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['d'], desc: 'Delete operator' },
        { chars: ['c'], desc: 'Change operator (delete + Insert)' },
        { chars: ['y'], desc: 'Yank (copy) operator' },
        { chars: ['p'], desc: 'Paste after cursor / below line' },
        { chars: ['P'], desc: 'Paste before cursor / above line' },
        { chars: ['.'], desc: 'Repeat last change' },
        { chars: ['u'], desc: 'Undo' },
        { chars: ['Ctrl-r'], desc: 'Redo' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '',
          'int main() {',
          '    int count = 3;           // rename to "items"',
          '    int total = 0;',
          '    int debugValue = 42;     // remove this line',
          '    total = count * 2;       // duplicate and adjust',
          '    std::cout << total << "\\n";',
          '}'
        ],
        initialCursor: { line: 3, col: 4 },
        goalsRequired: 3,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          'w', 'b', 'e',
          '0', '^', '$',
          'd', 'c', 'y', 'p', 'P',
          '1', '2', '3', '4', '5', '6', '7', '8', '9',
          '.', 'u', 'Ctrl-r',
          'i', 'a', 'o', 'O',
          'Escape'
        ],
        goals: [
          {
            id: 'rename-count-to-items',
            type: 'change',
            description: 'Rename all occurrences of "count" to "items" inside main.',
            validator: (prev, next) => {
              const text = next.buffer.join('\n');
              return text.includes('items') && !text.includes('count');
            }
          },
          {
            id: 'remove-debug-line',
            type: 'delete',
            description: 'Remove the whole line that declares "debugValue".',
            validator: (prev, next) => {
              const text = next.buffer.join('\n');
              return !text.includes('debugValue');
            }
          },
          {
            id: 'add-multiplier-3',
            type: 'insert',
            description: 'Create a second assignment line "total = items * 3;" below the existing "total = items * 2;" line.',
            validator: (prev, next) => {
              const text = next.buffer.join('\n');
              return text.includes('total = items * 2;') &&
                     text.includes('total = items * 3;');
            }
          }
        ]
      }
    }
  ]
};
