import type { Lesson } from '@/core/types';

export const repeatDot: Lesson = {
  slug: 'repeat-dot',
  title: '重复命令',
  categoryId: 'edits',
  shortDescription: '学习使用点命令重复上一次修改',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## 重复命令（点命令）

点命令（.）是 Vim 中最强大的命令之一，它可以**重复上一次的修改**。

**基本用法**：

1. 执行一次修改操作（如 dw, cw, x 等）
2. 移动到下一个位置
3. 按点命令重复刚才的修改

**什么会被重复？**

- 删除操作：x, dd, dw, d$ 等
- 修改操作：cw, c$ 等
- 插入操作：进入 Insert 模式后输入的所有内容

**经典示例**：

假设你想删除多个单词：

\`\`\`
1. 按 dw 删除第一个单词
2. 按 w 移动到下一个单词
3. 按 . 重复删除
4. 按 w, 按 . (重复步骤 3-4)
\`\`\`

**使用场景**：

- 批量删除：dw ... w . w .
- 批量添加内容：i-Esc ... j . j .
- 批量修改：cw new Esc ... w . w .

**与数字前缀结合**：

- 3. 重复上一次修改 3 次

**注意**：

- 点命令只重复修改，不重复移动
- Insert 模式中，从进入到退出的所有输入算作一次修改
- 移动命令（如 w, j）不会被点命令重复
`
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['.'], desc: 'Repeat last change' },
        { chars: ['d', 'w', 'w', '.'], desc: 'Delete word, move, repeat' },
        { chars: ['x', 'l', '.'], desc: 'Delete char, move, repeat' }
      ]
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          'int oldValue = 1;',
          'double oldPrice = 2.5;',
          'string oldName = "test";'
        ],
        initialCursor: { line: 0, col: 4 },
        autoPlaySpeed: 900,
        tracks: [
          { label: 'dw + . + .', keys: ['d', 'w', 'w', '.', 'j', 'w', '.'], color: '#10b981' },
          { label: 'x + . + .', keys: ['0', 'x', 'l', '.', 'l', '.'], color: '#3b82f6' }
        ],
        steps: [
          { key: 'd', description: 'Press d' },
          { key: 'w', description: 'Delete word "oldValue"' },
          { key: 'w', description: 'Move to next word' },
          { key: '.', description: 'Repeat dw' },
          { key: 'j', description: 'Move down' },
          { key: 'w', description: 'Move to oldPrice' },
          { key: '.', description: 'Repeat dw' },
          { key: '0', description: 'Move to line start' },
          { key: 'x', description: 'Delete first char' },
          { key: 'l', description: 'Move right' },
          { key: '.', description: 'Repeat x' },
          { key: 'l', description: 'Move right' },
          { key: '.', description: 'Repeat x again' }
        ]
      }
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          'int total = items * 2;',
          'double ratio = 3.14;',
          'string text = "data";'
        ],
        initialCursor: { line: 0, col: 0 },
        enabledCommands: ['h', 'j', 'k', 'l', 'w', 'b', 'e', '0', '$', 'd', 'x', 'i', 'a', '.', 'Escape'],
        goalsRequired: 2,
        goals: [
          {
            id: 'delete-and-repeat',
            type: 'custom',
            description: 'Use dw to delete "int", move with w, then use . to delete "total"',
            validator: (prev, next) => {
              const text = next.buffer.join('\n');
              return !text.includes('int') && !text.includes('total');
            }
          },
          {
            id: 'insert-and-repeat',
            type: 'custom',
            description: 'Use i to insert "new " before "ratio", exit with Esc, move to line 3, and use . to repeat',
            validator: (prev, next) => {
              const text = next.buffer.join('\n');
              return text.includes('new ratio') && text.includes('new text');
            }
          }
        ]
      }
    }
  ]
};
