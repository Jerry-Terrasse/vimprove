import type { Lesson } from '@/core/types';

export const wordsMiniReview: Lesson = {
  slug: 'words-mini-review',
  title: 'Mini review: word motions + small edits',
  categoryId: 'chapter2',
  shortDescription: 'Combine word motions with x, s, and r to quickly clean up a small snippet.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Putting it together

You now know how to:

- Move by **words** with **w, b, e**.
- Jump by **WORDs** with **W, B, E**.
- Fix tiny mistakes with **x, s, r**.
- Briefly enter Insert mode with **i/a** and exit with **Esc**.

This mini review lets you clean up a small piece of code using any combo you like.

Focus on:

- Jumping with word/WORD motions instead of many \`h/l\`.
- Using \`x/s/r\` for tiny edits, not long Insert sessions.`
    },
    {
      type: 'markdown',
      content: `## Example: comparing h/l, w, and W

The example animates three cursors: one stepping with **h/l**, one with **w**, and one with **W**.
Watch how word and WORD motions reach targets in far fewer keystrokes than single-character steps.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          'std::vector<int> values = {1, 2, 3};'
        ],
        initialCursor: { line: 0, col: 0 },
        autoPlaySpeed: 700,
        tracks: [
          { label: 'Using h/l', keys: [], color: 'bg-red-500' },
          { label: 'Using w (word)', keys: [], color: 'bg-blue-500' },
          { label: 'Using W (WORD)', keys: [], color: 'bg-green-500' }
        ],
        steps: [
          { key: 'l', description: 'h/l cursor: move right one character.', cursorIndex: 0 },
          { key: 'l', description: 'h/l cursor: move right again.', cursorIndex: 0 },
          { key: 'l', description: 'h/l cursor: move right again.', cursorIndex: 0 },
          { key: 'l', description: 'h/l cursor: still stepping through "std::vector<int>".', cursorIndex: 0 },
          { key: 'w', description: 'w cursor: jump to "values".', cursorIndex: 1 },
          { key: 'w', description: 'w cursor: jump to "=".', cursorIndex: 1 },
          { key: 'W', description: 'W cursor: jump over "std::vector<int>" as one WORD.', cursorIndex: 2 },
          { key: 'W', description: 'W cursor: jump to "{1," in a single step.', cursorIndex: 2 }
        ]
      }
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['w'], desc: 'Next word start' },
        { chars: ['b'], desc: 'Previous word start' },
        { chars: ['e'], desc: 'Word end' },
        { chars: ['W'], desc: 'Next WORD start' },
        { chars: ['B'], desc: 'Previous WORD start' },
        { chars: ['E'], desc: 'WORD end' },
        { chars: ['x'], desc: 'Delete character' },
        { chars: ['s'], desc: 'Substitute character and insert' },
        { chars: ['r'], desc: 'Replace character' },
        { chars: ['i'], desc: 'Insert before cursor' },
        { chars: ['a'], desc: 'Insert after cursor' },
        { chars: ['o'], desc: 'Open new line below and insert' },
        { chars: ['Esc'], desc: 'Back to Normal' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          'let totalCount = 0;',
          'let curentCount = 1;  // typo',
          'if (curentCount == totalCount) {',
          '  console.log("Match!");',
          '}'
        ],
        initialCursor: { line: 0, col: 0 },
        goalsRequired: 3,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          'w', 'b', 'e',
          'W', 'B', 'E',
          'x', 's', 'r',
          'i', 'a', 'o',
          'Escape'
        ],
        goals: [
          {
            id: 'fix-curentCount',
            type: 'change',
            description: 'Rename all occurrences of "curentCount" to "currentCount".',
            validator: (prev, next) => {
              const text = next.buffer.join('\n');
              return text.includes('currentCount') && !text.includes('curentCount');
            }
          },
          {
            id: 'strict-equals-again',
            type: 'change',
            description: 'Change "==" to "===" in the if condition.',
            validator: (prev, next) => {
              if (next.buffer.length < 3) return false;
              const line = next.buffer[2];
              return line.includes('===') && !line.includes(' == ');
            }
          },
          {
            id: 'add-todo-comment-review',
            type: 'insert',
            description: 'Add a TODO comment line like "// TODO: check other counters".',
            validator: (prev, next) => {
              return next.buffer.some(line =>
                line.includes('// TODO: check other counters')
              );
            }
          }
        ]
      }
    }
  ]
};
