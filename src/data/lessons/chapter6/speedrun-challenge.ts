import type { Lesson } from '@/core/types';

export const speedrunChallenge: Lesson = {
  slug: 'speedrun-challenge',
  title: 'Speedrun drills: small tasks, fast moves',
  categoryId: 'chapter6',
  shortDescription: 'Practice small, repeatable edits with search, text objects, and dot-repeat.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Speed drills for muscle memory

This lesson is your **practice arena**.

You already know how to:

- Move by words and WORDs.
- Search with **/**, **n**, and ***.
- Edit with operators and text objects.
- Repeat with **.**.

Now you will solve several tiny tasks on one snippet.  
Try to perform them **cleanly and quickly** – even if the website does not time you yet.`
    },
    {
      type: 'markdown',
      content: `## Example: rename a repeated variable

The example works on a short function that uses the variable \`value\` several times.
We search for "value" with \`*\`, rename it once with \`ciw\`,
then use \`n\` and \`.\` to repeat the same change on the remaining occurrences.`
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          'int main() {',
          '    int value = 0;',
          '    value += 1;',
          '    value += 1;',
          '}'
        ],
        // On the v in the first "value"
        initialCursor: { line: 1, col: 8 },
        autoPlaySpeed: 800,
        tracks: [
          { label: 'Search + ciw + dot', keys: ['*', 'c', 'i', 'w', 'x', 'Escape', 'n', '.'] }
        ],
        steps: [
          { key: '*', description: '*: search for the word "value" and jump to the next match.', cursorIndex: 0 },
          { key: 'c', description: 'c: start a change on the word under the cursor.', cursorIndex: 0 },
          { key: 'i', description: 'i: choose inner word.', cursorIndex: 0 },
          { key: 'w', description: 'w: ciw – delete the word and enter Insert mode.', cursorIndex: 0 },
          { key: 'x', description: 'Type "x" as the new short name.', cursorIndex: 0 },
          { key: 'Escape', description: 'Escape: finish editing this occurrence.', cursorIndex: 0 },
          { key: 'n', description: 'n: jump to the next "value".', cursorIndex: 0 },
          { key: '.', description: '.: repeat the change and rename the next occurrence to "x".', cursorIndex: 0 }
        ]
      }
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['*'], desc: 'Search for the word under the cursor' },
        { chars: ['c', 'i', 'w'], desc: 'Change the inner word' },
        { chars: ['n'], desc: 'Jump to next match' },
        { chars: ['.'], desc: 'Repeat the last change' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          '#include <iostream>',
          '',
          'int main() {',
          '    int value = 0;  // TODO: rename and initialize',
          '    std::cout << value << "\\n";',
          '}'
        ],
        initialCursor: { line: 2, col: 0 },
        goalsRequired: 3,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          'w', 'b', 'e', 'W', 'B', 'E',
          '0', '^', '$',
          '/', '?', 'n', 'N', '*', '#',
          'd', 'c', 'y', 'x',
          'i', 'a', 'I', 'A', 'o', 'O',
          'iw', 'aw', 'i"', 'a"',
          '.',
          'u', 'Ctrl-r',
          '1', '2', '3', '4', '5', '6', '7', '8', '9',
          'Escape',
          'Backspace', 'Enter'
        ],
        goals: [
          {
            id: 'rename-value-to-count',
            type: 'change',
            description: 'Rename "value" to "count" everywhere in the snippet.',
            validator: (prev, next) => {
              const text = next.buffer.join('\\n');
              const hasOld = text.includes('value');
              const hasNew = text.includes('count');
              return !hasOld && hasNew;
            }
          },
          {
            id: 'change-initializer-to-42',
            type: 'change',
            description: 'Change the initializer so that count is initialized to 42.',
            validator: (prev, next) => {
              const text = next.buffer.join('\\n');
              return text.includes('int count = 42;') && !text.includes('int count = 0;');
            }
          },
          {
            id: 'remove-todo-comment',
            type: 'delete',
            description: 'Remove the trailing TODO comment from the declaration line.',
            validator: (prev, next) => {
              const text = next.buffer.join('\\n');
              return !text.includes('TODO: rename and initialize');
            }
          }
        ]
      }
    }
  ]
};
