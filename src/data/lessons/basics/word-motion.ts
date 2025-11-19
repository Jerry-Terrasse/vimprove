import type { Lesson } from '@/core/types';

export const wordMotion: Lesson = {
  slug: 'word-motion',
  title: 'Moving by Words',
  categoryId: 'basics',
  shortDescription: 'Jump around faster using word motions.',
  contentBlocks: [
    {
      type: 'markdown',
      content: 'Moving character by character is inefficient. Use **w** to jump to the start of the next word.'
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['w'], desc: 'Jump to next word' },
        { chars: ['b'], desc: 'Jump to previous word' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          'Start here.',
          'Jump to the end.',
          'One word at a time.',
          'GOAL'
        ],
        initialCursor: { line: 0, col: 0 },
        goalsRequired: 1,
        enabledCommands: ['h', 'j', 'k', 'l', 'w', 'b'],
        goals: [
          {
            id: 'reach-goal',
            type: 'move',
            description: 'Navigate to "GOAL" using w',
            validator: (prev, next) => next.cursor.line === 3 && next.cursor.col === 0
          }
        ]
      }
    }
  ]
};
