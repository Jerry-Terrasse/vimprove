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
      content: `## Example: fixing a word with w/b/e and Insert

In the example we travel with **w/e** to the end of \`count\`, enter Insert with **a**,
and type a couple of letters to turn it into \`counter\`.
It highlights the rhythm of navigate first, then make a quick edit.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          'int main() {',
          '    int count = 0;',
          '}'
        ],
        initialCursor: { line: 1, col: 4 },
        autoPlaySpeed: 900,
        tracks: [
          { label: 'Word + Insert', keys: [] }
        ],
        steps: [
          { key: 'w', description: 'w: jump to "int".', cursorIndex: 0 },
          { key: 'w', description: 'w: jump to "count".', cursorIndex: 0 },
          { key: 'e', description: 'e: jump to the end of "count".', cursorIndex: 0 },
          { key: 'a', description: 'a: enter Insert mode just after "count".', cursorIndex: 0 },
          { key: 'e', description: 'Type "e" to start adding "er".', cursorIndex: 0 },
          { key: 'r', description: 'Type "r" to complete the new name "counter".', cursorIndex: 0 },
          { key: 'Escape', description: 'Escape: go back to Normal with the fixed name.', cursorIndex: 0 }
        ]
      }
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
