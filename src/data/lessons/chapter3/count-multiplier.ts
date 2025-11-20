import type { Lesson } from '@/core/types';

export const countMultiplier: Lesson = {
  slug: 'count-multiplier',
  title: '数字前缀',
  categoryId: 'chapter3',
  shortDescription: '学习使用数字前缀来重复命令',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## 数字前缀（Count Multiplier）

在 Vim 中，你可以在命令前加上数字，让命令重复执行多次。

**基本语法**：

\`\`\`
[count] + command
\`\`\`

**移动命令**：

- \`3w\` - 向前移动 3 个单词
- \`5j\` - 向下移动 5 行
- \`2b\` - 向后移动 2 个单词

**编辑命令**：

- \`3dd\` - 删除 3 行
- \`2dw\` - 删除 2 个单词
- \`4x\` - 删除 4 个字符

**组合操作**：

- \`d3w\` - 删除 3 个单词（等价于 \`3dw\`）
- \`c2w\` - 修改 2 个单词
- \`y5j\` - 复制当前行及下面 5 行（共 6 行）

**使用场景**：

- 需要快速移动到远处：\`10j\` 比按 10 次 \`j\` 快得多
- 需要删除多行：\`3dd\` 比 \`dd\` \`dd\` \`dd\` 更高效
- 需要重复相同操作：\`5i-Esc\` 会插入 5 个 \`-\`

**注意**：

- 数字必须在命令之前
- \`0\` 不能作为 count（它是"移动到行首"命令）
- 所以 count 只能是 \`1-9\` 开头的数字
`
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['3', 'w'], desc: 'Move forward 3 words' },
        { chars: ['5', 'j'], desc: 'Move down 5 lines' },
        { chars: ['2', 'd', 'd'], desc: 'Delete 2 lines' },
        { chars: ['3', 'd', 'w'], desc: 'Delete 3 words' },
        { chars: ['4', 'x'], desc: 'Delete 4 characters' }
      ]
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          'int a = 1;',
          'int b = 2;',
          'int c = 3;',
          'int d = 4;',
          'int e = 5;',
          'return a + b + c + d + e;'
        ],
        initialCursor: { line: 0, col: 0 },
        autoPlaySpeed: 1000,
        tracks: [
          { label: '3j', keys: ['3', 'j'], color: '#10b981' },
          { label: '2dd', keys: ['2', 'd', 'd'], color: '#f59e0b' },
          { label: '3w', keys: ['3', 'w'], color: '#3b82f6' }
        ],
        steps: [
          { key: '3', description: 'Press 3 (count prefix)' },
          { key: 'j', description: 'Move down 3 lines' },
          { key: '2', description: 'Press 2' },
          { key: 'd', description: 'Press d' },
          { key: 'd', description: 'Delete 2 lines' },
          { key: '3', description: 'Press 3' },
          { key: 'w', description: 'Move forward 3 words' }
        ]
      }
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          'int a = 1;',
          'int b = 2;',
          'int c = 3;',
          'int d = 4;',
          'int e = 5;',
          'return a + b + c;'
        ],
        initialCursor: { line: 0, col: 0 },
        enabledCommands: ['h', 'j', 'k', 'l', 'w', 'b', 'd', 'x', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
        goalsRequired: 3,
        goals: [
          {
            id: 'move-3-down',
            type: 'move',
            description: 'Use 3j to move down 3 lines (to "int d = 4;")',
            validator: (prev, next) => {
              return next.cursor.line === 3;
            }
          },
          {
            id: 'delete-2-lines',
            type: 'delete',
            description: 'Use 2dd to delete 2 lines starting from current line',
            validator: (prev, next) => {
              return next.buffer.length <= 4 &&
                     !next.buffer.join('\n').includes('int d') &&
                     !next.buffer.join('\n').includes('int e');
            }
          },
          {
            id: 'move-3-words',
            type: 'move',
            description: 'Move to the last line and use 3w to move 3 words forward',
            validator: (prev, next) => {
              return next.cursor.line === next.buffer.length - 1 &&
                     next.cursor.col > 10;
            }
          }
        ]
      }
    }
  ]
};
