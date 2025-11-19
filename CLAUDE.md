# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vimprove 是一个交互式 Vim 学习网站。核心功能是通过浏览器中的"迷你 Vim 编辑器 + 关卡式练习"来教用户实际操作 Vim 命令。

**当前状态**: 项目处于重构阶段。原型代码在 `vimprove.html` 中，需要拆分为模块化的 React + TypeScript 项目。

## Development Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Architecture

### Core Design Principles

1. **配置驱动的课程系统**: 新增课程只需添加配置文件，无需修改核心代码
2. **纯函数的 Vim 引擎**: 所有状态更新通过 reducer，便于测试
3. **严格的模块分离**: Core/Data/Hooks/Components 各层职责单一

### Module Structure

```
src/
├── core/              # Vim 引擎核心（纯逻辑，零依赖）
│   ├── types.ts      # 所有类型定义（Buffer, Cursor, VimState, Command, ChallengeGoal 等）
│   ├── vimReducer.ts # 核心状态管理 reducer
│   ├── motions.ts    # 移动逻辑（h/j/k/l/w/b/0/$/f/t 等）
│   ├── operators.ts  # 操作符逻辑（d/c/y + motion）
│   └── utils.ts      # 工具函数（clampCursor, isWhitespace）
│
├── data/              # 课程数据（只依赖 core/types）
│   ├── categories.ts # 课程分类定义
│   └── lessons/      # 每个课程一个文件
│       ├── basics/   # 基础章节
│       └── edits/    # 编辑章节
│
├── hooks/             # 自定义 hooks（业务逻辑封装）
│   ├── useVimEngine.ts    # 封装 vimReducer
│   ├── useChallenge.ts    # 挑战逻辑（目标验证、计时）
│   └── useProgress.ts     # 进度持久化（localStorage）
│
├── components/        # UI 组件
│   ├── common/       # 通用组件（MarkdownBlock, KeyListBlock）
│   ├── lesson/       # 课程相关（LessonView, LessonNav）
│   ├── challenge/    # 挑战相关（VimChallenge, VimEditor, GoalsList）
│   └── layout/       # 布局组件（Sidebar, Header）
│
├── pages/            # 页面组件
│   ├── HomePage.tsx
│   └── LessonPage.tsx
│
└── i18n/             # 国际化支持
```

### Key Data Flow

```
User Keyboard Input
    ↓
VimChallenge (Component)
    ↓
useVimEngine (Hook) → dispatch(action)
    ↓
vimReducer (Core) → motions.ts / operators.ts
    ↓
New VimState
    ↓
├─→ VimEditor (Render Buffer)
└─→ useChallenge (Validate Goals) → useProgress (Persist)
```

### Vim Engine State Machine

**VimState 结构**:
```typescript
{
  buffer: string[],           // 每行一个字符串（不含换行符）
  cursor: { line: number, col: number },
  mode: 'normal' | 'insert',
  pendingOperator: null | 'd' | 'c' | 'y',
  lastCommand: Command        // 用于 goal validator
}
```

**关键约束**:
- 所有状态更新必须是纯函数：`nextState = vimReducer(prevState, action)`
- `ESC` 在任何状态下都必须清空所有 pending 状态
- Cursor 必须始终保持在合法范围内（通过 `clampCursor` 保证）
- Operator + Motion 解析必须明确，避免残留错误状态

### Challenge Goal System

每个课程的 Challenge 通过 `validator` 函数判断目标完成：

```typescript
type ChallengeGoal = {
  id: string;
  type: 'move' | 'delete' | 'change' | 'insert' | 'custom';
  description: string;
  validator: (prev: VimState, next: VimState, lastCommand: Command) => boolean;
};
```

**重要**: 目标验证只认可 Vim 命令产生的状态变化，禁用鼠标选择/复制粘贴等原生操作。

## Path Aliases

使用 `@/` 前缀导入模块：

```typescript
import { VimState } from '@/core/types';
import { LESSONS } from '@/data';
import { useVimEngine } from '@/hooks/useVimEngine';
```

## Refactoring Guide

原型代码 `vimprove.html` 的映射关系（参考 `tmp/refactor-plan.md`）：

- **L52-328**: Vim 引擎核心 → `src/core/`
  - L52-58: INITIAL_VIM_STATE
  - L61-132: getMotionTarget → `motions.ts`
  - L135-328: vimReducer
  - L204-267: Operator 处理逻辑 → `operators.ts`

- **L332-443**: 课程数据 → `src/data/`
  - L332-335: CATEGORIES
  - L338-376: moving-hjkl lesson
  - L377-402: word-motion lesson
  - L403-423: deletion lesson
  - L424-443: insert-mode lesson

- **L449-755**: 组件 → `src/components/`
  - L449-458: MarkdownBlock
  - L461-476: KeyListBlock
  - L479-674: VimChallenge
  - L677-719: LessonView
  - L722-755: HomeView

## Adding New Lessons

新增课程步骤：

1. 在 `src/data/lessons/{category}/` 创建文件：
```typescript
// src/data/lessons/basics/new-lesson.ts
import { Lesson } from '@/core/types';

export const newLesson: Lesson = {
  slug: 'new-lesson',
  title: 'Lesson Title',
  categoryId: 'basics',
  shortDescription: '...',
  contentBlocks: [
    { type: 'markdown', content: '...' },
    { type: 'key-list', keys: [...] },
    { type: 'challenge', config: {
      initialBuffer: ['...'],
      initialCursor: { line: 0, col: 0 },
      enabledCommands: ['h','j','k','l'],
      goals: [{
        id: 'goal-1',
        type: 'move',
        description: '...',
        validator: (prev, next) => next.cursor.line === 3
      }],
      goalsRequired: 1
    }}
  ]
};
```

2. 在 `src/data/lessons/index.ts` 导入并添加到 LESSONS 数组

无需修改任何其他代码，新课程自动出现在侧边栏和路由中。

## Important Constraints

1. **Vim 引擎边界情况必须处理**:
   - 空文件/空行
   - Cursor 越界
   - Operator pending 时输入无效键
   - Find 命令未找到目标字符

2. **键盘输入捕获方案**:
   - 使用隐藏的 `<input>` 捕获所有键盘事件（不用 contenteditable）
   - 所有 Vim 命令通过 `keydown` 事件处理
   - 必须 `preventDefault()` 避免浏览器默认行为
   - 失焦时提示用户点击恢复

3. **禁止的操作**:
   - 不要创建文档/脚本文件（除非用户明确要求）
   - 避免使用 emoji（除非用户要求）
   - 注释只在非平凡（non-trivial）位置添加

## TypeScript Configuration

- 使用严格模式 (`strict: true`)
- Path aliases 已配置（见 `tsconfig.app.json`）
- 项目使用 project references (`tsconfig.json` 引用 `tsconfig.app.json` 和 `tsconfig.node.json`）

## Styling

- 使用 Tailwind CSS 3.x（**不要用 4.x**）
- 配置已包含自定义动画和 stone-950 颜色
- 样式入口: `src/styles/index.css`
