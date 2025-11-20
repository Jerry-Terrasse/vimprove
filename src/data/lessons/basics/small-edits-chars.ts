import type { Lesson } from '@/core/types';

export const smallEditsChars: Lesson = {
  slug: 'small-edits-chars',
  title: 'Small edits: x, s, r',
  categoryId: 'chapter2',
  shortDescription: 'Use x, s, and r to clean up tiny mistakes without full Insert mode.',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Three tools for tiny mistakes

For one-character fixes you do not need a big Insert session.

In Normal mode:

- **x** – delete the character under the cursor.
- **s** – delete the character under the cursor **and** enter Insert mode.
- **r{char}** – replace the character under the cursor with \`{char}\` and stay in Normal.

They are perfect for things like:

- Changing \`==\` into \`===\`.
- Fixing a single letter in a word.
- Removing an extra symbol.`
    },
    {
      type: 'markdown',
      content: `## Playable example: from "==" to "==="

Start with:

\`\`\`js
if (count == 0) {
  console.log("Zerro");
}
\`\`\`

Two possible animations:

1. Using **x**:
   - Move to the second \`=\` in \`==\`.
   - Press **x** to remove it.
   - Type \`=\` in Insert mode (or use \`i\` + typing).

2. Using **r**:
   - Move to the space after \`==\`.
   - Move left onto the second \`=\`.
   - Press **r=** to turn the second \`=\` into another \`=\`, giving \`===\`.

Then:

- Move to the word \`Zerro\`.
- Use **s** on the \`e\`:
  - \`s\` deletes \`e\` and enters Insert mode.
  - Type \`e\` again if you want to change it, or use Backspace and retype the whole word.
- Fix \`Zerro\` → \`Zero\`.
- Press **Esc** to return to Normal.`
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['x'], desc: 'Delete character under cursor' },
        { chars: ['s'], desc: 'Delete character under cursor and enter Insert' },
        { chars: ['r'], desc: 'Replace character under cursor with next typed character' },
        { chars: ['Esc'], desc: 'Back to Normal mode' }
      ]
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          'if (count == 0) {',
          '  console.log("Zerro")',
          '}'
        ],
        initialCursor: { line: 0, col: 0 },
        goalsRequired: 2,
        enabledCommands: ['h', 'j', 'k', 'l', 'x', 's', 'r', 'i', 'a', 'Escape'],
        goals: [
          {
            id: 'make-strict-equals',
            type: 'change',
            description: 'Change "==" into "===" in the if condition.',
            validator: (prev, next) => {
              if (!next.buffer.length) return false;
              const line = next.buffer[0];
              return line.includes('===') && !line.includes(' == ') && !line.includes(' == 0');
            }
          },
          {
            id: 'fix-zerro',
            type: 'change',
            description: 'Fix the string so that it reads "Zero" instead of "Zerro".',
            validator: (prev, next) => {
              if (next.buffer.length < 2) return false;
              const line = next.buffer[1];
              return line.includes('"Zero"') && !line.includes('"Zerro"');
            }
          }
        ]
      }
    }
  ]
};
