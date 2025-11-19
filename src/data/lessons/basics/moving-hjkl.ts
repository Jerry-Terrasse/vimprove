import type { Lesson } from '@/core/types';

export const movingHjkl: Lesson = {
  slug: 'moving-hjkl',
  title: 'The Basics: HJKL',
  categoryId: 'basics',
  shortDescription: 'Ditch the arrow keys. Learn to move strictly with home row keys.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Why HJKL?

In Vim, your fingers stay on the home row.
- **h** is left
- **j** is down
- **k** is up
- **l** is right`
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['h'], desc: 'Move Left' },
        { chars: ['j'], desc: 'Move Down' },
        { chars: ['k'], desc: 'Move Up' },
        { chars: ['l'], desc: 'Move Right' },
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          'Welcome to Vim.',
          "Use 'j' to go down.",
          "Use 'l' to go right.",
          '      TARGET'
        ],
        initialCursor: { line: 0, col: 0 },
        goalsRequired: 1,
        enabledCommands: ['h', 'j', 'k', 'l'],
        goals: [
          {
            id: 'reach-target',
            type: 'move',
            description: 'Move cursor to "TARGET"',
            validator: (prev, next) => next.cursor.line === 3 && next.cursor.col >= 6
          }
        ]
      }
    }
  ]
};
