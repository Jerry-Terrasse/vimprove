# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vimprove 是一个交互式 Vim 学习网站。核心功能是通过浏览器中的"迷你 Vim 编辑器 + 关卡式练习"来教用户实际操作 Vim 命令。

**当前状态**: ✅ 重构完成。项目已从单文件原型（`tmp/vimprove.html`）重构为模块化的 React + TypeScript 架构。

**版本**: v0.4.0 Alpha（版本管理在 `src/version.ts` 和 `package.json`）

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
│   └── lessons/      # 每个课程一个文件（按章节组织）
│       ├── chapter1/ # 模式与基础移动（4课）
│       ├── chapter2/ # 单词移动与小编辑（5课）
│       └── chapter3/ # 高级编辑（5课）
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
  pendingReplace: boolean,    // r 命令的等待状态
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

## Vim Engine Capabilities

### ✅ 已支持的命令

**Normal Mode 移动**:
- `h`, `j`, `k`, `l` - 基础移动（左下上右）
- `w`, `b`, `e` - 单词移动（word）
- `W`, `B`, `E` - WORD 移动（空白分隔）
- `0`, `^`, `_`, `$` - 行首/首字符/行尾

**编辑命令**:
- `x` - 删除字符
- `s` - 删除字符并进入 Insert 模式
- `r{char}` - 替换当前字符
- `dd` - 删除行
- `d{motion}` - 删除到 motion 位置（如 `dw`, `d$`）
- `c{motion}` - 修改到 motion 位置（删除后进入 Insert 模式）
- `y{motion}`, `yy` - 复制（yank）文本
- `p`, `P` - 在光标后/前粘贴

**模式切换**:
- `i`, `a` - 在光标前/后进入 Insert 模式
- `I`, `A` - 在行首/行尾进入 Insert 模式
- `o`, `O` - 在下方/上方新建行并进入 Insert 模式
- `Escape` - 回到 Normal 模式

**Insert Mode**:
- 可见字符输入
- `Backspace` - 删除前一个字符
- `Enter` - 换行

**查找命令**:
- `f{char}`, `F{char}` - 向前/向后查找字符
- `t{char}`, `T{char}` - 向前/向后查找到字符前
- `;`, `,` - 重复/反向重复上次查找

**其他命令**:
- `u` - 撤销（undo）
- `Ctrl-r` - 重做（redo）
- `.` - 重复上次修改操作
- 数字前缀（`3w`, `5dd`, `2.`）- 重复命令 n 次

### ❌ 尚未支持

- Text Objects（`iw`, `aw`, `i"`, `a{`）
- Visual Mode
- 搜索和替换（`/`, `:s`）
- 寄存器选择（`"a`, `"b` 等）

**扩展引擎**: 如需添加新命令，修改 `src/core/motions.ts` 或 `src/core/operators.ts`

**辅助函数** (`src/core/utils.ts`):
- `isWordChar(char)` - 判断是否为单词字符 `[a-zA-Z0-9_]`
- `isPunctuation(char)` - 判断是否为标点符号

## Adding New Lessons

### 快速开始

1. **复制模板**: `tmp/lesson-template.ts` 包含完整的课程文件模板
2. **创建课程文件**: `src/data/lessons/{category}/{slug}.ts`
3. **导入到索引**: 在 `src/data/index.ts` 添加导入

### 详细指南

**完整的课程编写文档**: `tmp/course-creation-guide.md`
- 包含所有技术规格、validator 编写技巧、常用模式
- 适合课程内容生成 AI 使用

**技术支持能力**: `tmp/tech-support-capabilities.md`
- 说明技术 AI 可以提供的支持（命令扩展、调试等）

**协作总览**: `tmp/README-COURSE-COLLAB.md`
- 课程 AI 和技术 AI 的协作流程

### 课程文件示例

```typescript
// src/data/lessons/basics/new-lesson.ts
import type { Lesson } from '@/core/types';

export const newLesson: Lesson = {
  slug: 'new-lesson',
  title: 'Lesson Title',
  categoryId: 'basics',
  shortDescription: 'Brief description',
  contentBlocks: [
    { type: 'markdown', content: '## Title\n\nContent...' },
    { type: 'key-list', keys: [
      { chars: ['h'], desc: 'Move left' }
    ]},
    { type: 'challenge', config: {
      initialBuffer: ['Line 1', 'Line 2'],
      initialCursor: { line: 0, col: 0 },
      enabledCommands: ['h','j','k','l'],
      goals: [{
        id: 'goal-1',
        type: 'move',
        description: 'Move to line 2',
        validator: (prev, next) => next.cursor.line === 1
      }],
      goalsRequired: 1
    }}
  ]
};
```

然后在 `src/data/index.ts` 添加：
```typescript
import { newLesson } from './lessons/basics/new-lesson';
export const LESSONS: Lesson[] = [..., newLesson];
```

**无需修改其他代码**，新课程自动出现在侧边栏和路由中。

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
- 样式入口: `src/index.css`（已配置 Tailwind directives）
- 主题色: Stone 色系（深色主题）
- Logo: `tmp/vimprove.png`（已设置为网站图标）

## Quick Start（新会话开始时）

### 项目现状检查

```bash
# 启动开发服务器
npm run dev
# 访问 http://localhost:3000

# 检查项目结构
ls src/
# 应看到: core/ data/ hooks/ components/ pages/ i18n/ version.ts

# 查看现有课程
ls src/data/lessons/chapter1/
ls src/data/lessons/chapter2/
ls src/data/lessons/chapter3/
```

### 当前已完成

- ✅ 模块化架构（Core/Data/Hooks/Components）
- ✅ 14 个课程（Chapter 1-3 完成，包括 basics 和 edits）
- ✅ 完整的 Vim 引擎（支持 w/b/e/W/B/E/s/r/f/t/F/T/;/,/y/p/P/u/Ctrl-r 等命令）
- ✅ Undo/Redo 系统
- ✅ Yank/Paste 功能
- ✅ 数字前缀（Count Multiplier）
- ✅ 查找字符（f/F/t/T/;/,）
- ✅ Challenge 系统（目标验证、计时）
- ✅ Run Example 可播放示例（`src/components/example/RunExamplePlayer.tsx`）
- ✅ 版本管理（v0.3.0 Alpha）
- ✅ 网站图标和 PWA 支持
- ✅ 课程编写协作文档（`tmp/` 目录）

### 下一步任务（参考）

**课程扩展**:
1. 添加更多 Vim 命令（`e`, `W`, `B`, `f`, `t` 等）
2. 创建更多课程（参考 `tmp/course-creation-guide.md`）
3. 添加新分类（如 `motions`, `text-objects`, `advanced`）

**功能增强**:
1. 进度统计和展示（`useProgress` hook 已实现，但 UI 未完成）
2. 成就系统
3. 多语言支持（i18n 基础已搭建）

**优化**:
1. 添加单元测试（尤其是 Vim 引擎）
2. 性能优化
3. 移动端适配

### 重要文件位置

- **课程协作文档**: `tmp/README-COURSE-COLLAB.md`（协作总览）
- **课程编写指南**: `tmp/course-creation-guide.md`（给课程 AI）
- **技术支持说明**: `tmp/tech-support-capabilities.md`（给技术 AI）
- **课程模板**: `tmp/lesson-template.ts`（快速创建新课程）
- **Run Example 模板**: `tmp/run-example-template.md`（可播放示例编写指南）
- **Motion 修复记录**: `tmp/motion-fixes-summary.md`（w/b/e/W/B/E 的实现细节）
- **版本管理**: `src/version.ts` + `tmp/version-management.md`
- **原型参考**: `tmp/vimprove.html`（已完成重构，仅供参考）

## CLAUDE.md 更新规则

**只记录重要的结构性变化，小事不写入**：
- ✅ 新增核心功能模块（如 Run Example）
- ✅ 重大 bug 修复（如 motion 逻辑重写）
- ✅ 新增重要辅助函数或类型
- ✅ 课程总数变化
- ✅ 重要文档位置
- ❌ 单个课程内容
- ❌ 小的样式调整
- ❌ 临时的调试信息

## 版本管理规则

**版本号格式**: `MAJOR.MINOR.PATCH` (遵循 SemVer)

**更新规则**：
- **PATCH** (0.3.x): Bug 修复、小的样式调整
- **MINOR** (0.x.0): 新功能、新课程章节、新命令支持
- **MAJOR** (x.0.0): 重大架构变更、不兼容的 API 变化

**更新文件**：
- `src/version.ts` - 应用内版本显示
- `package.json` - 包版本号
- `README.md` - CHANGELOG 版本记录

**何时更新版本**：
- 添加新章节（如 Chapter 4）→ MINOR++
- 添加新核心功能（如 undo/redo、yank/paste、dot command）→ MINOR++
- 修复 Bug → PATCH++
- 每次提交前检查是否需要更新版本

**版本历史详见 README.md 的 CHANGELOG 部分**
