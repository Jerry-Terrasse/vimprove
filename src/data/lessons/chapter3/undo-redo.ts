import type { Lesson } from '@/core/types';

export const undoRedo: Lesson = {
  slug: 'undo-redo',
  title: '撤销与重做',
  categoryId: 'chapter3',
  shortDescription: '学习 Vim 的撤销和重做命令',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## 撤销（Undo）与重做（Redo）

即使是 Vim 高手也会犯错。幸运的是，Vim 有强大的撤销/重做系统。

**基本命令**：

- \`u\` - 撤销上一次修改 (undo)
- \`Ctrl-r\` - 重做被撤销的修改 (redo)

**工作原理**：

Vim 会记录你的每一次修改（不是每一次按键）。一次"修改"可能是：

- 删除一行 (\`dd\`)
- 修改一个单词 (\`cw\` + 输入新内容)
- 在 Insert 模式中输入的所有内容（从进入到退出）

**撤销策略**：

- 按 \`u\` 一次，撤销最近一次修改
- 连续按 \`u\`，可以一直撤销到初始状态
- 如果撤销过头了，按 \`Ctrl-r\` 重做

**最佳实践**：

- 在 Insert 模式中，经常按 \`Esc\` 回到 Normal 模式，这样可以创建更细粒度的撤销点
- 如果不确定修改是否正确，先试试，不行就 \`u\` 撤销
`
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['u'], desc: 'Undo last change' },
        { chars: ['Ctrl', 'r'], desc: 'Redo undone change' }
      ]
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          'int value = 42;',
          'double ratio = 3.14;',
          'string text = "hello";'
        ],
        initialCursor: { line: 0, col: 0 },
        autoPlaySpeed: 1000,
        tracks: [
          { label: 'dd + u', keys: ['d', 'd', 'u'], color: '#10b981' },
          { label: 'cw + u + Ctrl-r', keys: ['j', 'c', 'w', 'n', 'u', 'm', 'Escape', 'u', 'Ctrl-r'], color: '#3b82f6' }
        ],
        steps: [
          { key: 'd', description: 'Press d' },
          { key: 'd', description: 'Delete first line' },
          { key: 'u', description: 'Undo - line comes back!' },
          { key: 'j', description: 'Move down' },
          { key: 'c', description: 'Press c' },
          { key: 'w', description: 'Change word "double"' },
          { key: 'n', description: 'Type "num"' },
          { key: 'u', description: 'u' },
          { key: 'm', description: 'm' },
          { key: 'Escape', description: 'Exit insert mode' },
          { key: 'u', description: 'Undo change' },
          { key: 'Ctrl-r', description: 'Redo change' }
        ]
      }
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          'int a = 1;',
          'int b = 2;',
          'int c = 3;'
        ],
        initialCursor: { line: 0, col: 0 },
        enabledCommands: ['h', 'j', 'k', 'l', 'w', 'b', 'd', 'x', 'u', 'Ctrl-r'],
        goalsRequired: 3,
        goals: [
          {
            id: 'delete-and-undo',
            type: 'custom',
            description: 'Delete the first line with dd, then undo it with u',
            validator: (prev, next) => {
              return next.buffer.length === 3 &&
                     next.buffer[0].includes('int a = 1');
            }
          },
          {
            id: 'delete-word',
            type: 'delete',
            description: 'Use dw to delete "int" from the second line',
            validator: (prev, next) => {
              return next.buffer[1] && !next.buffer[1].trim().startsWith('int');
            }
          },
          {
            id: 'undo-then-redo',
            type: 'custom',
            description: 'Undo the deletion with u, then redo it with Ctrl-r',
            validator: (prev, next) => {
              return next.buffer[1] && !next.buffer[1].trim().startsWith('int');
            }
          }
        ]
      }
    }
  ]
};
