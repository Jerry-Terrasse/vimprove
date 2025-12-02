# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vimprove 是一个交互式 Vim 学习网站。核心功能是通过浏览器中的"迷你 Vim 编辑器 + 关卡式练习"来教用户实际操作 Vim 命令。

**当前状态**: ✅ 重构完成。项目已从单文件原型（`tmp/vimprove.html`）重构为模块化的 React + TypeScript 架构。

**课程范围**: 已完成 Chapter 1-6（基础、进阶编辑、行内 find/till、文本对象、搜索/重构），共 27 节课。

**版本管理**: 版本号在 `src/version.ts` 和 `package.json` 中维护，CHANGELOG 见 `README.md`（当前 1.0.0）

## Development Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npx vitest run --pool=threads # deprecated
# Note: please refer to section "Test Workflow" and use ./utils/vitest-quickcheck.sh to improve efficiency.
```

## Test Workflow

- 默认并行：`npx vitest run --pool=threads`（避免直接跑无过滤的 `npx vitest run`，输出过长会淹没上下文）
- 测试输出简化： **重要** 使用`grep`过滤最终结论，避免无用信息淹没上下文。如 `npx vitest run --pool=threads [-t <pattern>] 2>&1 | grep -EA20 "Failed Tests|Test Files"`
- 测试输出长度：`grep -EA20`是使用的20行，所获信息不足时，可以根据实际情况适当增加，建议不超过50行
- Parity 单测输出节流：`npx vitest run --pool=threads -t "<pattern>" src/core/tests/exhaustiveTest.*.test.ts 2>&1 | grep -EA20 "Failed Tests|Test Files"`，避免海量 skip 日志淹没上下文
- exhaustive parity 分片：`src/core/tests/exhaustiveTest.{0..7}.test.ts` 使用 `getShardCases` 按索引取模分片（总 shard=8），并行示例：`npx vitest run --pool=threads src/core/tests/exhaustiveTest.*.test.ts --maxWorkers=8`
- 快速检查脚本：`bash utils/vitest-quickcheck.sh [<test_glob>]`（tap-flat + bail，默认跑全部，可传入路径/模式，成功输出 ok ✅，失败时列出前 5 条 not ok）
- 深入排查（exhaustive parity）：
  - 生成 JSON 报告：`npx vitest run --pool=threads --reporter=json --outputFile tmp/vimParity-report.json src/core/tests/exhaustiveTest.*.test.ts`
  - 查看摘要/聚合或按子串过滤：`python utils/vimParity-report-viewer.py tmp/vimParity-report.json ["keyword"...]`（keyword 为测试名片段，支持多个并且大小写不敏感；工具仅用于 ParityExhaustive）
    - 支持附加参数：`--feature paste-after-op`、`--limit 5`、`--sort name|feature|line`、`--details`（输出完整断言）
  - 反复调试单用例：`npx vitest run --pool=threads -t "<pattern>" src/core/tests/exhaustiveTest.*.test.ts 2>&1 | grep -EA20 "Failed Tests|Test Files"`
    - 正则含特殊符号时建议单引号包裹并在内部转义，如 `-t 'd\$P\.'`

- ### Debug Tips & Tools

- 生成组合差异时优先跑 `bash utils/vitest-quickcheck.sh`（Tap + bail）或 `npx vitest run --pool=threads -t "<case>" 2>&1 | grep -EA20 "Failed Tests|Test Files"`，务必加上过滤，避免全量输出淹没上下文。
- 若 Neovim 输出夹杂错误日志，可用 `utils/nvim-state-probe.cjs` 直接打印 stdout/stderr 以及解析后的 state：`node utils/nvim-state-probe.cjs --lines '["foo bar"]' --cursor 1,5 --keys 'p' --debug`；支持 `--file` 读取文本文件，`--cursor` 为 1-based。
- Parity 排查时，先用 probe 得到 Neovim 游标/模式，再用 `runSimKeys` 对比，减少反复跑大测试集。
- `utils/vimprove-debug.cjs`：输入 shard 与 label（用例名）对比模拟器与 Neovim 的缓冲区/光标/模式，并可加 `--trace` 打印逐键状态（需 `node -r sucrase/register utils/vimprove-debug.cjs <label> <shard> [--trace]`）。
- 定位顺序：1) quickcheck 抽样锁定 case；2) probe 取 Neovim 真实游标/模式；3) `runSimKeys` 对比；避免直接跑全量。

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
│   │                 # Lesson/ContentBlock/KeyItem 支持可选 i18nKey 字段
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
│       ├── chapter3/ # 高级编辑（5课）
│       ├── chapter4/ # 行内 find/till 精准编辑（4课）
│       ├── chapter5/ # 文本对象（5课）
│       └── chapter6/ # 搜索与重构（4课）
│
├── hooks/             # 自定义 hooks（业务逻辑封装）
│   ├── useVimEngine.ts    # 封装 vimReducer
│   ├── useChallenge.ts    # 挑战逻辑（目标验证、计时）
│   ├── useProgress.ts     # 进度持久化（localStorage）
│   └── useI18n.ts         # i18n hooks（useTranslationSafe, useLocale）
│
├── components/        # UI 组件
│   ├── common/       # 通用组件（MarkdownBlock, KeyListBlock）
│   ├── lesson/       # 课程相关（LessonView, LessonNav）
│   ├── challenge/    # 挑战相关（VimChallenge 内置编辑器 + GoalsList）
│   └── layout/       # 布局组件（Sidebar, Header）
│
├── pages/            # 页面组件
│   ├── HomePage.tsx
│   └── LessonPage.tsx
│
└── i18n/             # 国际化支持
    ├── config.ts     # i18n 配置与初始化（使用 Vite glob 动态加载）
    ├── index.ts      # 导出配置与类型
    └── locales/      # 语言包（按语言/命名空间组织）
        ├── en/       # 英文
        │   ├── common.json    # 通用词汇
        │   ├── layout.json    # 布局组件
        │   ├── home.json      # 主页
        │   ├── lesson.json    # 课程页面
        │   ├── challenge.json # 挑战组件
        │   ├── example.json   # Run Example 组件
        │   ├── settings.json  # 设置页面
        │   └── lessons.json   # 课程内容翻译（按 slug 组织）
        └── zh/       # 中文（结构同 en）
```

### i18n Architecture

**技术栈**: `i18next` + `react-i18next` + `i18next-browser-languagedetector`

**配置位置**: `src/i18n/config.ts`
- 使用 Vite 的 `import.meta.glob` 动态加载所有语言包（eager 模式）
- 语言检测顺序: querystring → localStorage → navigator
- 自动持久化到 localStorage
- 默认语言: `en`，支持: `en`, `zh`, `zh-lively`

**自定义 Hooks** (`src/hooks/useI18n.ts`):
- `useTranslationSafe`: 封装 `useTranslation`，支持 defaultValue 回退
- `useLocale`: 管理语言切换，自动持久化到 localStorage

**课程数据 i18n 支持**:
- `Lesson`, `ContentBlock`, `KeyItem` 均支持可选的 `i18nKey` 字段
- 渲染时优先使用 `lessons.{slug}.*` 翻译键，回退到原始字符串
- Markdown 内容、Run Example 步骤、Challenge 目标均可翻译
- 课程分类（categories）通过 `i18nKey` 关联到翻译文件

**课程内容翻译结构**（重要设计决策）:
- **英文内容直接位于课程 .ts 文件中**（如 `src/data/lessons/chapter1/modes-basics.ts`），用于定义课程结构和默认内容
- **其他语言（zh, zh-lively 等）使用 JSON 翻译文件**（如 `src/i18n/locales/zh/lessons.json`）
- **网站其他部分（设置、布局等）所有语言都有独立 JSON 文件**（包括英文）
- 这种设计避免了英文课程内容的重复存储，课程 .ts 文件既是代码也是英文数据源

**App 初始化**:
- App 根组件包裹 `I18nextProvider` + `Suspense`（loading fallback）
- `initI18n()` 在渲染前完成初始化
- 所有组件通过 `useTranslationSafe` 或 `useTranslation` 获取翻译

**Sidebar 语言切换设计模式**:
- 底部行：左侧"首页"按钮 + 右侧"语言"按钮（等宽布局）
- 语言按钮显示短标签（`shortLabel`）如 Eng/中/活，避免文字过长压缩图标
- 语言菜单从按钮右侧弹出，显示完整的 `nativeLabel`
- 添加新语言时保持此模式（修改 `supportedLocales` 并添加 `shortLabel` 字段和语言包）

**重要约束**:
- Run Example 初始化顺序：`executeStepImmediately` 必须在首次调用前声明（避免 TDZ 错误）
- 翻译键命名约定: `{namespace}.{category}.{key}` (如 `lessons.basics-intro.title`)
- 新增语言只需: 1) 添加语言包文件夹 2) 更新 `supportedLocales` 配置
 - i18n 结构易错点：`LessonView` 按 `lessons.{slug}.content.{idx}` 渲染；翻译文件的所有块必须放在 `content` 对象里，键为字符串数字（"0","1"...），顺序与英文 contentBlocks 一致。不要用顶层 `content.n`，也不要让 markdown 段落落到对象类型，否则会出现 “returned an object instead of string”。

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
├─→ VimChallenge 内置编辑器 (Render Buffer)
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

**搜索**:
- `/pattern`, `?pattern` - 正向/反向搜索
- `n`, `N` - 按搜索方向跳转到下一个/上一个匹配
- `*`, `#` - 以当前单词为模式搜索正向/反向

**文本对象**:
- 词与段落：`iw/aw`, `ip/ap`
- 括号：`i(`/`a(`，`i{`/`a{`，`i[`/`a[`
- 引号：`i"`/`a"`, `i'`/`a'`, `i\``/`a\``
- 可与 `d/c/y` 组合使用

**其他命令**:
- `u` - 撤销（undo）
- `Ctrl-r` - 重做（redo）
- `.` - 重复上次修改操作
- 数字前缀（`3w`, `5dd`, `2.`）- 重复命令 n 次

**行为细节**:
- 行级 count 越界：`dd`/`yy` 当 count 超出剩余行数时直接 no-op，不写入历史。
- `.` 重放：count 覆盖命令的 count（执行一次带 count 的命令），插入/替换按记录的插入锚点与片段回放；undo 后仍以 lastChange 重放。
- 多行寄存器粘贴（非行 wise）：内容拆成多行插入，首行插入列与 before/after 一致，光标落在首行插入处。
- `o/O` 带 count：一次性创建多行再进入首行插入，退出时按记录的行数补齐。

### ❌ 尚未支持

- Visual Mode
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

3. **页面加载优化** (`index.html` + `main.tsx`):
   - `index.html` 中设置深色背景 (`body { background-color: #0c0a09 }`) 和加载动画 (`#loading`)
   - React 渲染完成后在 `main.tsx` 中淡出并移除加载动画元素
   - 避免白屏闪烁问题

4. **禁止的操作**:
   - 不要创建文档/脚本文件（除非用户明确要求）
   - 避免使用 emoji（除非用户要求）
   - 注释只在非平凡（non-trivial）位置添加

5. **i18n 相关约束**:
   - 新增 UI 组件必须使用 `useTranslationSafe` 或 `useTranslation` 获取文案
   - 硬编码文案只允许在语言包 JSON 文件中
   - 添加新课程时，必须同时提供 `en` 和 `zh` 翻译（通过 `i18nKey` 或直接在 `lessons.json` 中）
   - 修改 `supportedLocales` 后需要添加对应的语言包文件夹

   **JSON 文件引号规范**（重要）:
   - **必须使用英文半角引号** `"` 而非中文全角引号 `""`
   - 在中文翻译文件中引用代码、命令、字符时，内层引号必须转义: `\"u\"`
   - 错误示例: `"移到错字母 "u"。"` ❌（中文引号会导致 JSON 语法错误）
   - 正确示例: `"移到错字母 \"u\"。"` ✅

   **翻译质量要求**:
   - **因地制宜，而非逐句直译**: 翻译时应考虑目标语言特征，从知识传递的高度理解原文
   - **保留关键信息关联**: 当英文原文通过词汇联系传递知识时（如 "i" 命令与 "insert" 的关联），翻译需保留这种联系
   - **示例**:
     - ❌ 直译: "You can read them as tiny English phrases: i → 'insert here'" → "可以把它们当成小短语：i → '在光标前插入'"（丢失了 i 和 insert 的关联）
     - ✅ 意译: "它们可以用对应英文理解: `i` -> 插入(Insert)"（保留了助记关联，更有教学价值）
   - **适当保留英文术语**: 对于 Vim 命令相关的核心概念（如 motion、operator、text object），可在中文后附英文以增强理解

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
- ✅ 27 个课程（Chapter 1-6：基础、进阶、文本对象、搜索重构）
- ✅ 完整的 Vim 引擎（支持文本对象、搜索 `/ ? n N * #`、find/till、`.` 等命令）
- ✅ Undo/Redo 系统
- ✅ Yank/Paste 功能
- ✅ 数字前缀（Count Multiplier）
- ✅ 查找/搜索（f/F/t/T/;/,/ / ? * # n N）
- ✅ `.` 命令（重复上次修改操作）
- ✅ 完整的单元测试系统（Vitest，覆盖核心功能与新增命令）
- ✅ Challenge 系统（目标验证、计时）
- ✅ Run Example 可播放示例（`src/components/example/RunExamplePlayer.tsx`）
- ✅ 网站图标和 PWA 支持
- ✅ 课程编写协作文档（`tmp/` 目录）
- ✅ 完整的 i18n 支持（i18next，当前支持 en/zh/zh-lively，课程内容可翻译）
- ✅ 学习进度记忆（localStorage 记录"已开始学习"状态，自动跳过首页）
- ✅ 课程导航悬浮按钮（上一课/下一课快捷跳转）
- ✅ 页面加载优化（深色背景加载动画，消除白屏闪烁）

## 重要文件位置

**课程相关**:
- **课程协作文档**: `tmp/README-COURSE-COLLAB.md`（协作总览）
- **课程编写指南**: `tmp/course-creation-guide.md`（给课程 AI）
- **技术支持说明**: `tmp/tech-support-capabilities.md`（给技术 AI）
- **课程模板**: `tmp/lesson-template.ts`（快速创建新课程）
- **Run Example 模板**: `tmp/run-example-template.md`（可播放示例编写指南）

**技术文档**:
- **Motion 修复记录**: `tmp/motion-fixes-summary.md`（w/b/e/W/B/E 的实现细节）
- **Dot 命令测试**: `tmp/dot-command-test.md`（`.` 命令测试指南）
- **测试总结**: `tmp/test-summary.md`（单元测试覆盖和统计）
- **版本管理**: `src/version.ts` + `tmp/version-management.md`
- **原型参考**: `tmp/vimprove.html`（已完成重构，仅供参考）

**i18n 相关**:
- **i18n 配置**: `src/i18n/config.ts`（初始化与语言包加载）
- **i18n Hooks**: `src/hooks/useI18n.ts`（useTranslationSafe, useLocale）
- **语言包**: `src/i18n/locales/{en|zh}/*.json`（按命名空间组织）
- **类型定义**: `src/core/types.ts`（Lesson/ContentBlock/KeyItem 的 i18nKey 字段）

**测试文件**:
- `src/core/motions.test.ts` - 移动命令测试
- `src/core/operators.test.ts` - 操作符测试
- `src/core/vimReducer.test.ts` - 核心 reducer 测试
- `src/core/dot-command.test.ts` - Dot 命令测试

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
- **PATCH** (0.x.1): Bug 修复、小的样式调整
- **MINOR** (0.x.0): 新功能、新课程章节、新命令支持
- **MAJOR** (x.0.0): 重大架构变更、不兼容的 API 变化

**更新文件**（版本号只记录在这些文件中）：
- `src/version.ts` - 应用内版本显示
- `package.json` - 包版本号
- `README.md` - CHANGELOG 版本记录（包含版本号和更新内容）

**何时更新版本**：
- 添加新章节（如 Chapter 4）→ MINOR++
- 添加新核心功能（如 undo/redo、yank/paste、dot command、testing）→ MINOR++
- 修复 Bug → PATCH++
- 每次提交前检查是否需要更新版本

**CHANGELOG 编写规则**：
- **每个版本最多 4 条更新条目**（精简为主，合并相关变更）
- 按重要性排序：新功能 > Bug 修复 > 优化改进
- 相关条目合并（如多个相关 bug 修复合并为一条）
- 使用简洁描述，必要时用括号补充关键细节

**重要**: CLAUDE.md 不记录具体版本号，只记录重要的结构性变化和功能说明
