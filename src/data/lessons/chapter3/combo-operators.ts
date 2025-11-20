import type { Lesson } from '@/core/types';

export const comboOperators: Lesson = {
  slug: 'combo-operators',
  title: '组合操作符',
  categoryId: 'chapter3',
  shortDescription: '学习 Vim 的"操作符+移动"模式',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## 操作符 + 移动 = 高效编辑

在 Vim 中，很多编辑命令都遵循 **"操作符 + 移动"** 的模式：

- \`d\` (delete) + \`w\` (word) = **删除一个单词**
- \`c\` (change) + \`$\` (行尾) = **修改到行尾**
- \`y\` (yank) + \`j\` (下一行) = **复制两行** (当前行 + 下一行)

这种"语法"让你可以组合出数百种编辑命令，而不需要记忆每一个。

**核心操作符**：

- \`d\` - 删除 (delete)
- \`c\` - 修改 (change) - 删除后进入 Insert 模式
- \`y\` - 复制 (yank)

**常用移动**：

- \`w/b/e\` - 单词移动
- \`0/$\` - 行首/行尾
- \`j/k\` - 上下行
- \`h/l\` - 左右字符

**示例**：

- \`dw\` - 删除光标到下一个单词开头
- \`d$\` - 删除光标到行尾
- \`c0\` - 修改光标到行首 (删除内容并进入插入模式)
- \`yw\` - 复制一个单词
`
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['d', 'w'], desc: 'Delete word' },
        { chars: ['d', '$'], desc: 'Delete to end of line' },
        { chars: ['d', '0'], desc: 'Delete to start of line' },
        { chars: ['c', 'w'], desc: 'Change word' },
        { chars: ['c', '$'], desc: 'Change to end of line' },
        { chars: ['y', 'w'], desc: 'Yank (copy) word' }
      ]
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          'int result = calculateValue();',
          'if (result > threshold) {',
          '    processData();',
          '}'
        ],
        initialCursor: { line: 0, col: 4 },
        autoPlaySpeed: 800,
        tracks: [
          { label: 'dw', keys: ['d', 'w'], color: '#10b981' },
          { label: 'd$', keys: ['d', '$'], color: '#3b82f6' },
          { label: 'cw', keys: ['c', 'w', 'o', 'u', 't', 'c', 'o', 'm', 'e', 'Escape'], color: '#f59e0b' }
        ],
        steps: [
          { key: 'd', description: 'Press d (delete operator)' },
          { key: 'w', description: 'Press w (delete word "result")' },
          { key: 'd', description: 'Press d again' },
          { key: '$', description: 'Press $ (delete to end of line)' },
          { key: 'j', description: 'Move down' },
          { key: 'w', description: 'Move to "result"' },
          { key: 'c', description: 'Press c (change operator)' },
          { key: 'w', description: 'Press w (change word)' },
          { key: 'o', description: 'Type "outcome"' },
          { key: 'u', description: 'u' },
          { key: 't', description: 't' },
          { key: 'c', description: 'c' },
          { key: 'o', description: 'o' },
          { key: 'm', description: 'm' },
          { key: 'e', description: 'e' },
          { key: 'Escape', description: 'Exit insert mode' }
        ]
      }
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          'int total = items * 2;',
          'double price = 19.99;',
          'string name = "product";'
        ],
        initialCursor: { line: 0, col: 4 },
        enabledCommands: ['h', 'j', 'k', 'l', 'w', 'b', 'e', '0', '$', 'd', 'c', 'y', 'i', 'a', 'Escape'],
        goalsRequired: 3,
        goals: [
          {
            id: 'delete-total',
            type: 'delete',
            description: 'Use dw to delete the word "total"',
            validator: (prev, next) => {
              const text = next.buffer.join('\n');
              return !text.includes('total') && text.includes('int');
            }
          },
          {
            id: 'delete-to-end',
            type: 'delete',
            description: 'Move to "price" and use d$ to delete to end of line',
            validator: (prev, next) => {
              const line1 = next.buffer[1] || '';
              return line1.trim() === 'double price';
            }
          },
          {
            id: 'change-word',
            type: 'change',
            description: 'Use cw on "product" to change it to "item"',
            validator: (prev, next) => {
              const text = next.buffer.join('\n');
              return text.includes('"item"') && !text.includes('"product"');
            }
          }
        ]
      }
    }
  ]
};
