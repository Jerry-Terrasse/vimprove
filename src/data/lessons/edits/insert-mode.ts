import type { Lesson } from '@/core/types';

export const insertMode: Lesson = {
  slug: 'insert-mode',
  title: 'Insert Mode',
  categoryId: 'edits',
  shortDescription: 'Switch between Normal and Insert modes.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Entering Text

Press **i** to enter Insert Mode. Type normally. Press **Esc** to go back to Normal Mode.`
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: ['Edit me: '],
        initialCursor: { line: 0, col: 0 },
        goalsRequired: 1,
        enabledCommands: ['i', 'Escape'],
        goals: [
          {
            id: 'add-text',
            type: 'insert',
            description: 'Add text "Hello" to the line',
            validator: (p, n) => n.buffer[0].includes('Hello')
          }
        ]
      }
    }
  ]
};
