import type { Lesson } from '@/core/types';

export const wordsFixSmallThings: Lesson = {
  slug: 'words-fix-small-things',
  title: 'Fix small things with word motions',
  categoryId: 'chapter2',
  shortDescription: 'Use w, b, e with i/a to quickly fix small typos.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Move, then insert

A common editing pattern in Vim:

1. In **Normal mode**, use **w/b/e** to land on the word you want.
2. Enter **Insert mode** with **i** (before) or **a** (after).
3. Use Backspace and typing to fix the word.
4. Press **Esc** to go back to Normal.

You move first, then type.`
    },
    {
      type: 'markdown',
      content: `## Playable example: fixing a typo

Start with:

\`\`\`js
const userNmae = 'Ada';
console.log(userNmae);
\`\`\`

Animation steps:

1. Start at the \`c\` in \`const\` (Normal mode).
2. Press **w** twice:
   - 1st \`w\` → \`userNmae\`
   - 2nd \`w\` → the \`=\` sign
3. Press **b** to jump back to the start of \`userNmae\`.
4. Press **i** to enter Insert mode **before** the word.
5. Use Backspace and typing to change \`userNmae\` → \`userName\`.
6. Press **Esc** to return to Normal.
7. Move to the second line and repeat the fix for the log call.

The example shows that you do not "drag" the cursor while typing.
You **jump with word motions**, fix briefly, then return to Normal.`
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['w'], desc: 'Next word start' },
        { chars: ['b'], desc: 'Previous word start' },
        { chars: ['e'], desc: 'Word end' },
        { chars: ['i'], desc: 'Insert before the cursor' },
        { chars: ['a'], desc: 'Insert after the cursor' },
        { chars: ['Esc'], desc: 'Back to Normal mode' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          "const userNmae = 'Ada';",
          'const isActve = true;',
          'console.log(userNmae, isActve);'
        ],
        initialCursor: { line: 0, col: 0 },
        goalsRequired: 2,
        enabledCommands: ['h', 'j', 'k', 'l', 'w', 'b', 'e', 'i', 'a', 'Escape'],
        goals: [
          {
            id: 'fix-username',
            type: 'change',
            description: 'Fix "userNmae" so that all occurrences become "userName".',
            validator: (prev, next) => {
              const text = next.buffer.join('\n');
              return text.includes('userName') && !text.includes('userNmae');
            }
          },
          {
            id: 'fix-isactive',
            type: 'change',
            description: 'Fix "isActve" so that all occurrences become "isActive".',
            validator: (prev, next) => {
              const text = next.buffer.join('\n');
              return text.includes('isActive') && !text.includes('isActve');
            }
          }
        ]
      }
    }
  ]
};
