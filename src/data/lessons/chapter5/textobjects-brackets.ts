import type { Lesson } from '@/core/types';

export const textobjectsBrackets: Lesson = {
  slug: 'textobjects-brackets',
  title: 'Bracket text objects: (), {}, []',
  categoryId: 'chapter5',
  shortDescription: 'Quickly operate on everything inside parentheses, braces, or brackets.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Bracket text objects

You often need to edit:

- Function argument lists: \`add(10, 20, 30)\`
- Initializer lists: \`values{1, 2, 3, 4}\`
- Arrays or vectors: \`values[0]\`

Text objects:

- **i(** / **a(** – inner / around parentheses.
- **i{** / **a{** – inner / around braces.
- **i[** / **a[** – inner / around brackets.

Combine with operators:

- **di(** – delete everything inside \`(...)\`.
- **ci{** – change everything inside \`{...}\`, then type new content.
- **yi(** – yank (copy) the inside of \`(...)\`.`
    },

    {
      type: 'run-example',
      config: {
        initialBuffer: [
          '#include <vector>',
          '',
          'int main() {',
          '    std::vector<int> values{1, 2, 3, 4};',
          '    auto result = add(10, 20, 30);',
          '}'
        ],
        initialCursor: { line: 4, col: 4 },
        autoPlaySpeed: 900,
        tracks: [
          { label: 'Clear arguments with di(', keys: ['f', '(', 'l', 'd', 'i', '('] }
        ],
        steps: [
          { key: 'f', description: 'f: find the "(".', cursorIndex: 0 },
          { key: '(', description: 'Target "(": jump to the opening parenthesis.', cursorIndex: 0 },
          { key: 'l', description: 'l: move inside the parentheses.', cursorIndex: 0 },
          { key: 'd', description: 'd: start delete operator.', cursorIndex: 0 },
          { key: 'i', description: 'i: choose the inner parentheses text object.', cursorIndex: 0 },
          { key: '(', description: '(: di( – delete all arguments, leaving add().', cursorIndex: 0 }
        ]
      }
    },

    {
      type: 'key-list',
      keys: [
        { chars: ['d', 'i', '('], desc: 'Delete inside (...), keeping the parentheses' },
        { chars: ['d', 'i', '{'], desc: 'Delete inside {...}, keeping the braces' },
        { chars: ['c', 'i', '('], desc: 'Change inside (...), then type new arguments' },
        { chars: ['y', 'i', '{'], desc: 'Yank inside an initializer list {...}' }
      ]
    },

    {
      type: 'challenge',
      config: {
        initialBuffer: [
          '#include <vector>',
          '',
          'int main() {',
          '    std::vector<int> values{1, 2, 3, 4};',
          '    auto result = add(10, 20, 30);',
          '}'
        ],
        initialCursor: { line: 3, col: 4 },
        goalsRequired: 2,
        enabledCommands: [
          'h', 'j', 'k', 'l',
          'w', 'b', 'e',
          '0', '^', '$',
          'd', 'c', 'y',
          'i', 'a', 'i(', 'a(', 'i{', 'a{', 'i[', 'a[',
          '1', '2', '3', '4', '5', '6', '7', '8', '9',
          'Escape'
        ],
        goals: [
          {
            id: 'clear-initializer',
            type: 'change',
            description: 'Change the initializer list so that values become an empty list: values{};',
            validator: (prev, next) => {
              const line = next.buffer.find(l => l.includes('std::vector<int> values'));
              if (!line) return false;
              return line.includes('values{};');
            }
          },
          {
            id: 'clear-add-arguments',
            type: 'change',
            description: 'Change the add(...) call so that it becomes add();',
            validator: (prev, next) => {
              const line = next.buffer.find(l => l.includes('auto result = add'));
              if (!line) return false;
              return line.includes('add();') && !line.includes('10') && !line.includes('20') && !line.includes('30');
            }
          }
        ]
      }
    }
  ]
};
