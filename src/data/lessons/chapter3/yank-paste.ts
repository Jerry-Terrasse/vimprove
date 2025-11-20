import type { Lesson } from '@/core/types';

export const yankPaste: Lesson = {
  slug: 'yank-paste',
  title: '复制粘贴',
  categoryId: 'chapter3',
  shortDescription: '学习 Vim 的 yank 和 paste 命令',
  contentBlocks: [
    {
      type: 'markdown',
      content: `## Yank（复制）和 Paste（粘贴）

在 Vim 中，"复制"叫做 **yank**，对应的命令是 \`y\`。

**基本用法**：

- \`yy\` - 复制整行（类似 \`dd\` 删除整行）
- \`yw\` - 复制一个单词
- \`y$\` - 复制到行尾
- \`yj\` - 复制当前行和下一行（两行）

**粘贴**：

- \`p\` - 在光标**后面**粘贴 (paste after)
- \`P\` - 在光标**前面**粘贴 (paste before)

**工作流程**：

1. \`yy\` 复制一行
2. 移动到目标位置
3. \`p\` 粘贴

**注意**：

- \`dd\` 删除的内容也会被保存，可以用 \`p\` 粘贴（类似"剪切"）
- \`yy\` 复制的是整行，粘贴时会在当前行的上方/下方插入新行
- \`yw\` 复制的是字符，粘贴时会在光标位置插入
`
    },
    {
      type: 'key-list',
      keys: [
        { chars: ['y', 'y'], desc: 'Yank (copy) current line' },
        { chars: ['y', 'w'], desc: 'Yank word' },
        { chars: ['y', '$'], desc: 'Yank to end of line' },
        { chars: ['p'], desc: 'Paste after cursor' },
        { chars: ['P'], desc: 'Paste before cursor' }
      ]
    },
    {
      type: 'run-example',
      config: {
        initialBuffer: [
          'function init() {',
          '    setupConfig();',
          '    loadData();',
          '}'
        ],
        initialCursor: { line: 1, col: 4 },
        autoPlaySpeed: 900,
        tracks: [
          { label: 'yy + p', keys: ['y', 'y', 'j', 'p'], color: '#10b981' },
          { label: 'yw + p', keys: ['0', 'y', 'w', '$', 'p'], color: '#3b82f6' }
        ],
        steps: [
          { key: 'y', description: 'Press y (yank operator)' },
          { key: 'y', description: 'Press y again (yank line)' },
          { key: 'j', description: 'Move down to "loadData()"' },
          { key: 'p', description: 'Paste after current line' },
          { key: 'k', description: 'Move up' },
          { key: '0', description: 'Move to line start' },
          { key: 'y', description: 'Press y' },
          { key: 'w', description: 'Yank word "setupConfig"' },
          { key: '$', description: 'Move to end of line' },
          { key: 'p', description: 'Paste after cursor' }
        ]
      }
    },
    {
      type: 'challenge',
      config: {
        initialBuffer: [
          'let x = 10;',
          'let y = 20;',
          'console.log(x);'
        ],
        initialCursor: { line: 0, col: 0 },
        enabledCommands: ['h', 'j', 'k', 'l', 'w', 'b', 'e', '0', '$', 'y', 'p', 'P'],
        goalsRequired: 2,
        goals: [
          {
            id: 'copy-line',
            type: 'custom',
            description: 'Use yy to copy the first line, then p to paste it after line 2',
            validator: (prev, next) => {
              return next.buffer.length >= 4 &&
                     next.buffer[0].includes('let x = 10') &&
                     next.buffer[2].includes('let x = 10');
            }
          },
          {
            id: 'copy-word',
            type: 'custom',
            description: 'Copy "console" using yw and paste it at the end of line 3',
            validator: (prev, next) => {
              const lastLine = next.buffer[next.buffer.length - 1] || '';
              return lastLine.includes('consoleconsole') || lastLine.includes('console.log(x);console');
            }
          }
        ]
      }
    }
  ]
};
