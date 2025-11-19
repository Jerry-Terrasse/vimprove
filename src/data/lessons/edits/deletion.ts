import type { Lesson } from '@/core/types';

export const deletion: Lesson = {
  slug: 'deletion',
  title: 'Deleting Text',
  categoryId: 'edits',
  shortDescription: 'Clean up your code with x and dd.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Fast Deletion

- Use **x** to delete a single character.
- Use **dd** to delete a whole line.`
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          'TypoZ here.',
          'DELETE THIS LINE',
          'Clean code.'
        ],
        initialCursor: { line: 0, col: 0 },
        goalsRequired: 2,
        enabledCommands: ['h', 'j', 'k', 'l', 'w', 'b', 'x', 'd'],
        goals: [
          {
            id: 'no-z',
            type: 'delete',
            description: 'Remove the "Z"',
            validator: (p, n) => !n.buffer[0].includes('Z')
          },
          {
            id: 'no-line',
            type: 'delete',
            description: 'Delete the screaming line',
            validator: (p, n) => !n.buffer.some(l => l.includes('DELETE'))
          }
        ]
      }
    }
  ]
};
